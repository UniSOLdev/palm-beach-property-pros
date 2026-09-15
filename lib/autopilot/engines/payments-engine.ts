import "server-only";
import { isStripeEnabled } from "@/lib/autopilot/config";
import { createInvoicePaymentLinkRecord } from "@/lib/autopilot/payments/create-payment-link";
import { getSession, isStripeConfigured } from "@/lib/autopilot/payments/stripe-client";
import { dailyRunKey } from "@/lib/autopilot/run-log";
import { runEngine } from "@/lib/autopilot/runner";
import type { EngineResult } from "@/lib/autopilot/types";
import { createServiceClient } from "@/lib/supabase/service";

export const PAYMENTS_JOB_KEY = "payments";

const STALE_PENDING_HOURS = 23;

export async function runPaymentsEngine(): Promise<EngineResult> {
  return runEngine(PAYMENTS_JOB_KEY, dailyRunKey(), executePaymentsEngine);
}

async function executePaymentsEngine(): Promise<EngineResult> {
  const result: EngineResult = {
    ok: true,
    jobKey: PAYMENTS_JOB_KEY,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    details: {},
  };

  if (!isStripeEnabled() || !isStripeConfigured()) {
    result.skipped = 1;
    result.details = {
      reason: isStripeEnabled() ? "stripe_not_configured" : "free_tier_stripe_disabled",
    };
    return result;
  }

  const supabase = createServiceClient();

  const expired = await expireStalePendingLinks(supabase);
  result.updated += expired.updated;
  result.skipped += expired.skipped;
  result.errors.push(...expired.errors);

  const created = await createLinksForSentInvoices(supabase);
  result.created += created.created;
  result.skipped += created.skipped;
  result.errors.push(...created.errors);

  result.ok = result.errors.length === 0;
  result.details = {
    expired: expired.updated,
    linksCreated: created.created,
  };

  return result;
}

async function expireStalePendingLinks(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ updated: number; skipped: number; errors: string[] }> {
  const cutoff = new Date(Date.now() - STALE_PENDING_HOURS * 60 * 60 * 1000).toISOString();

  const { data: staleLinks, error } = await supabase
    .from("payment_links")
    .select("id, stripe_checkout_session_id, created_at")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  if (error) {
    return { updated: 0, skipped: 0, errors: [error.message] };
  }

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const link of staleLinks ?? []) {
    let shouldExpire = true;

    if (link.stripe_checkout_session_id) {
      try {
        const session = await getSession(link.stripe_checkout_session_id);
        if (session.status === "open" && session.payment_status === "unpaid") {
          shouldExpire = false;
          skipped += 1;
        }
      } catch (sessionError) {
        const message = sessionError instanceof Error ? sessionError.message : String(sessionError);
        errors.push(`session ${link.stripe_checkout_session_id}: ${message}`);
      }
    }

    if (!shouldExpire) continue;

    const { error: updateError } = await supabase
      .from("payment_links")
      .update({ status: "expired" })
      .eq("id", link.id)
      .eq("status", "pending");

    if (updateError) {
      errors.push(updateError.message);
    } else {
      updated += 1;
    }
  }

  return { updated, skipped, errors };
}

async function createLinksForSentInvoices(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("document_status", "sent")
    .neq("payment_status", "Paid")
    .eq("archived", false);

  if (error) {
    return { created: 0, skipped: 0, errors: [error.message] };
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const invoice of invoices ?? []) {
    const { data: activeLinks } = await supabase
      .from("payment_links")
      .select("id")
      .eq("invoice_id", invoice.id)
      .in("status", ["pending", "paid"])
      .limit(1);

    if (activeLinks?.length) {
      skipped += 1;
      continue;
    }

    const outcome = await createInvoicePaymentLinkRecord(invoice.id);
    if (!outcome.ok) {
      errors.push(`${invoice.id}: ${outcome.error}`);
      continue;
    }
    if (outcome.skipped) {
      skipped += 1;
      continue;
    }
    created += 1;
  }

  return { created, skipped, errors };
}
