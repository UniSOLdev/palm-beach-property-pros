import "server-only";
import { sendMessage } from "@/lib/autopilot/comms/send";
import { runEngine } from "@/lib/autopilot/runner";
import type { EngineResult } from "@/lib/autopilot/types";
import { createServiceClient } from "@/lib/supabase/service";

export type WeeklyDigestStats = {
  newLeads: number;
  jobsScheduled: number;
  openInvoices: number;
  lowStockCount: number;
  weekStart: string;
  weekEnd: string;
};

function mondayRunKey(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function weekRange(): { start: string; end: string; startIso: string; endIso: string } {
  const monday = mondayRunKey();
  const start = new Date(`${monday}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const endDate = end.toISOString().slice(0, 10);
  return {
    start: monday,
    end: endDate,
    startIso: `${monday}T00:00:00.000Z`,
    endIso: `${endDate}T23:59:59.999Z`,
  };
}

export async function aggregateWeeklyDigestStats(): Promise<WeeklyDigestStats> {
  const supabase = createServiceClient();
  const { start, end, startIso, endIso } = weekRange();

  const [leadsRes, jobsRes, invoicesRes, suppliesRes] = await Promise.all([
    supabase
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("archived", false)
      .gte("created_at", startIso)
      .lte("created_at", endIso),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("archived", false)
      .gte("job_date", start)
      .lte("job_date", end)
      .neq("status", "Cancelled"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("archived", false)
      .neq("payment_status", "Paid"),
    supabase
      .from("supplies")
      .select("id, quantity, reorder_level")
      .eq("archived", false),
  ]);

  const supplies = suppliesRes.data ?? [];
  const lowStockCount = supplies.filter(
    (s) => Number(s.quantity) <= Number(s.reorder_level),
  ).length;

  return {
    newLeads: leadsRes.count ?? 0,
    jobsScheduled: jobsRes.count ?? 0,
    openInvoices: invoicesRes.count ?? 0,
    lowStockCount,
    weekStart: start,
    weekEnd: end,
  };
}

async function sendWeeklyDigestEmail(stats: WeeklyDigestStats): Promise<{
  sent: boolean;
  recipient: string | null;
  error?: string;
}> {
  const supabase = createServiceClient();
  const { data: settings } = await supabase
    .from("business_settings")
    .select("email")
    .limit(1)
    .maybeSingle();

  const recipient =
    process.env.AUTOPILOT_DIGEST_EMAIL?.trim() ||
    settings?.email?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    null;

  if (!recipient) {
    return {
      sent: false,
      recipient: null,
      error: "Set AUTOPILOT_DIGEST_EMAIL, business_settings.email, or RESEND_FROM_EMAIL",
    };
  }

  const vars: Record<string, string> = {
    new_leads: String(stats.newLeads),
    jobs_scheduled: String(stats.jobsScheduled),
    open_invoices: String(stats.openInvoices),
    low_stock_count: String(stats.lowStockCount),
    week_start: stats.weekStart,
    week_end: stats.weekEnd,
  };

  const result = await sendMessage({
    channel: "email",
    templateKey: "weekly_ops_digest",
    recipient,
    vars,
    entityType: "weekly_digest",
  });

  return {
    sent: result.ok,
    recipient,
    error: result.error,
  };
}

export async function runWeeklyOpsDigest(): Promise<EngineResult> {
  const runKey = mondayRunKey();

  return runEngine("digest", runKey, async () => {
    const stats = await aggregateWeeklyDigestStats();
    const email = await sendWeeklyDigestEmail(stats);

    if (!email.sent && email.error) {
      return {
        ok: false,
        jobKey: "digest",
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [email.error],
        details: { stats, recipient: email.recipient },
      };
    }

    return {
      ok: true,
      jobKey: "digest",
      created: email.sent ? 1 : 0,
      updated: 0,
      skipped: email.sent ? 0 : 1,
      errors: [],
      details: { stats, recipient: email.recipient, sent: email.sent },
    };
  });
}
