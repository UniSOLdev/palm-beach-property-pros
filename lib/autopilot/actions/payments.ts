"use server";

import { revalidatePath } from "next/cache";
import { createInvoicePaymentLinkRecord } from "@/lib/autopilot/payments/create-payment-link";
import { createClient } from "@/lib/supabase/server";

export type CreateInvoicePaymentLinkResult =
  | { ok: true; checkoutUrl: string; paymentLinkId: string }
  | { ok: false; error: string }
  | { ok: true; skipped: true; reason: string };

export async function createInvoicePaymentLink(
  invoiceId: string,
): Promise<CreateInvoicePaymentLinkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required" };
  }

  const outcome = await createInvoicePaymentLinkRecord(invoiceId, { force: false });

  if (!outcome.ok) {
    return { ok: false, error: outcome.error };
  }

  if (outcome.skipped) {
    return { ok: true, skipped: true, reason: outcome.reason };
  }

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoiceId}`);

  return {
    ok: true,
    checkoutUrl: outcome.checkoutUrl,
    paymentLinkId: outcome.paymentLink.id,
  };
}
