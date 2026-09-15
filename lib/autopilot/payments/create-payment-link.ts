import "server-only";
import { isStripeEnabled } from "@/lib/autopilot/config";
import { INVOICE_PATH_PREFIX, SITE_URL } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/service";
import {
  createCheckoutSession,
  isStripeConfigured,
  paymentIntentId,
} from "@/lib/autopilot/payments/stripe-client";

export type PaymentLinkType = "deposit" | "full";

export type PaymentLinkRow = {
  id: string;
  invoice_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  checkout_url: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
};

type InvoiceItemRow = {
  quantity: number;
  unit_price: number;
};

type QuoteDepositRow = {
  deposit_required: boolean;
  deposit_amount: number;
};

const MIN_AMOUNT_CENTS = 50;
const CHECKOUT_TTL_SECONDS = 23 * 60 * 60;

export function computeInvoicePayment(input: {
  discount: number;
  depositPaid: number;
  items: InvoiceItemRow[];
  quote?: QuoteDepositRow | null;
}): { linkType: PaymentLinkType; amountCents: number; totalDueCents: number } {
  const subtotalCents = Math.round(
    input.items.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_price), 0) * 100,
  );
  const discountCents = Math.round(Number(input.discount ?? 0) * 100);
  const depositPaidCents = Math.round(Number(input.depositPaid ?? 0) * 100);
  const totalDueCents = Math.max(0, subtotalCents - discountCents - depositPaidCents);

  const quoteDepositCents = Math.round(Number(input.quote?.deposit_amount ?? 0) * 100);
  const depositRemainingCents =
    input.quote?.deposit_required && quoteDepositCents > depositPaidCents
      ? quoteDepositCents - depositPaidCents
      : 0;

  const linkType: PaymentLinkType = depositRemainingCents > 0 ? "deposit" : "full";
  const amountCents = linkType === "deposit" ? depositRemainingCents : totalDueCents;

  return { linkType, amountCents, totalDueCents };
}

export async function createInvoicePaymentLinkRecord(
  invoiceId: string,
  options?: { force?: boolean },
): Promise<
  | { ok: true; skipped: false; paymentLink: PaymentLinkRow; checkoutUrl: string }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string }
> {
  if (!isStripeEnabled() || !isStripeConfigured()) {
    return {
      ok: true,
      skipped: true,
      reason: isStripeEnabled() ? "stripe_not_configured" : "free_tier_stripe_disabled",
    };
  }

  const supabase = createServiceClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, public_id, invoice_number, payment_status, discount, deposit_paid, quote_id, clients(email)")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError) return { ok: false, error: invoiceError.message };
  if (!invoice) return { ok: false, error: "Invoice not found" };
  if (invoice.payment_status === "Paid") {
    return { ok: true, skipped: true, reason: "invoice_already_paid" };
  }

  if (!options?.force) {
    const { data: existingPending } = await supabase
      .from("payment_links")
      .select("id")
      .eq("invoice_id", invoiceId)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (existingPending) {
      return { ok: true, skipped: true, reason: "pending_link_exists" };
    }
  }

  const { data: items, error: itemsError } = await supabase
    .from("invoice_items")
    .select("quantity, unit_price")
    .eq("invoice_id", invoiceId);

  if (itemsError) return { ok: false, error: itemsError.message };

  let quote: QuoteDepositRow | null = null;
  if (invoice.quote_id) {
    const { data: quoteRow } = await supabase
      .from("quotes")
      .select("deposit_required, deposit_amount")
      .eq("id", invoice.quote_id)
      .maybeSingle();
    quote = quoteRow;
  }

  const { linkType, amountCents } = computeInvoicePayment({
    discount: Number(invoice.discount ?? 0),
    depositPaid: Number(invoice.deposit_paid ?? 0),
    items: items ?? [],
    quote,
  });

  if (amountCents < MIN_AMOUNT_CENTS) {
    return { ok: true, skipped: true, reason: "amount_below_minimum" };
  }

  const publicPath = `${INVOICE_PATH_PREFIX}/${invoice.public_id}`;
  const successUrl = `${SITE_URL}${publicPath}?payment=success`;
  const cancelUrl = `${SITE_URL}${publicPath}?payment=cancelled`;
  const client = invoice.clients as { email?: string | null } | null;

  const { data: inserted, error: insertError } = await supabase
    .from("payment_links")
    .insert({
      invoice_id: invoiceId,
      amount_cents: amountCents,
      currency: "usd",
      status: "pending",
      metadata: {
        link_type: linkType,
        invoice_number: invoice.invoice_number,
      },
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? "Failed to create payment link row" };
  }

  try {
    const session = await createCheckoutSession({
      amountCents,
      currency: "usd",
      successUrl,
      cancelUrl,
      description: `Invoice ${invoice.invoice_number}${linkType === "deposit" ? " — deposit" : ""}`,
      customerEmail: client?.email ?? undefined,
      expiresAt: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_SECONDS,
      metadata: {
        invoice_id: invoiceId,
        payment_link_id: inserted.id,
        link_type: linkType,
        invoice_number: invoice.invoice_number,
      },
    });

    const checkoutUrl = session.url;
    if (!checkoutUrl) {
      await supabase.from("payment_links").update({ status: "failed" }).eq("id", inserted.id);
      return { ok: false, error: "Stripe checkout session missing URL" };
    }

    const { data: paymentLink, error: updateError } = await supabase
      .from("payment_links")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId(session),
        checkout_url: checkoutUrl,
      })
      .eq("id", inserted.id)
      .select("*")
      .single();

    if (updateError || !paymentLink) {
      return { ok: false, error: updateError?.message ?? "Failed to update payment link" };
    }

    return {
      ok: true,
      skipped: false,
      paymentLink: paymentLink as PaymentLinkRow,
      checkoutUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase
      .from("payment_links")
      .update({ status: "failed", metadata: { ...((inserted.metadata as object) ?? {}), error: message } })
      .eq("id", inserted.id);
    return { ok: false, error: message };
  }
}
