import "server-only";
import { processQueuedComms, sendMessage } from "@/lib/autopilot/comms/send";
import { sendLeadAcknowledgment } from "@/lib/autopilot/hooks/lead-comms";
import type { EngineResult } from "@/lib/autopilot/types";
import { formatCurrency } from "@/lib/admin/format";
import { INVOICE_PATH_PREFIX, SITE_URL } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/service";

export { sendLeadAcknowledgment };

const REMINDER_TEMPLATE = "invoice_reminder";
const REMINDER_COOLDOWN_DAYS = 7;

type OverdueInvoice = {
  id: string;
  invoice_number: string;
  public_id: string;
  due_date: string;
  discount: number;
  deposit_paid: number;
  client: { name: string; email: string | null } | null;
  items: { quantity: number; unit_price: number }[];
};

function invoiceTotal(invoice: OverdueInvoice): number {
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0,
  );
  return subtotal - Number(invoice.discount) - Number(invoice.deposit_paid);
}

async function wasReminderSentRecently(invoiceId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - REMINDER_COOLDOWN_DAYS);

  const { data } = await supabase
    .from("comms_log")
    .select("id")
    .eq("entity_type", "invoice")
    .eq("entity_id", invoiceId)
    .eq("template_key", REMINDER_TEMPLATE)
    .eq("channel", "email")
    .in("status", ["sent", "delivered"])
    .gte("created_at", since.toISOString())
    .limit(1);

  return (data?.length ?? 0) > 0;
}

async function sendOverdueInvoiceReminders(): Promise<{
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, public_id, due_date, discount, deposit_paid, clients(name, email), invoice_items(quantity, unit_price)",
    )
    .eq("archived", false)
    .neq("payment_status", "Paid")
    .not("due_date", "is", null)
    .lt("due_date", today);

  if (error) {
    return { sent: 0, skipped: 0, errors: [error.message] };
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const raw of invoices ?? []) {
    const row = raw as Record<string, unknown>;
    const nestedClient = row.clients as { name: string; email: string | null } | null;
    const nestedItems = (row.invoice_items ?? []) as { quantity: number; unit_price: number }[];

    const invoice: OverdueInvoice = {
      id: String(row.id),
      invoice_number: String(row.invoice_number),
      public_id: String(row.public_id),
      due_date: String(row.due_date),
      discount: Number(row.discount),
      deposit_paid: Number(row.deposit_paid),
      client: nestedClient,
      items: nestedItems,
    };

    const email = invoice.client?.email?.trim();
    if (!email) {
      skipped += 1;
      continue;
    }

    if (await wasReminderSentRecently(invoice.id)) {
      skipped += 1;
      continue;
    }

    const total = invoiceTotal(invoice);
    const result = await sendMessage({
      channel: "email",
      templateKey: REMINDER_TEMPLATE,
      recipient: email,
      vars: {
        name: invoice.client?.name ?? "there",
        invoice_number: invoice.invoice_number,
        amount: formatCurrency(Math.max(0, total)),
        payment_url: `${SITE_URL}${INVOICE_PATH_PREFIX}/${invoice.public_id}`,
      },
      entityType: "invoice",
      entityId: invoice.id,
    });

    if (result.status === "sent") {
      sent += 1;
    } else if (result.status === "skipped") {
      skipped += 1;
    } else if (result.error) {
      errors.push(`Invoice ${invoice.invoice_number}: ${result.error}`);
    }
  }

  return { sent, skipped, errors };
}

export async function runCommsEngine(): Promise<EngineResult> {
  const queued = await processQueuedComms();
  const reminders = await sendOverdueInvoiceReminders();

  const errors = [...queued.errors, ...reminders.errors];

  return {
    ok: errors.length === 0,
    jobKey: "comms",
    created: queued.sent + reminders.sent,
    updated: 0,
    skipped: queued.skipped + reminders.skipped,
    errors,
    details: {
      queuedSent: queued.sent,
      queuedFailed: queued.failed,
      invoiceRemindersSent: reminders.sent,
      invoiceRemindersSkipped: reminders.skipped,
    },
  };
}
