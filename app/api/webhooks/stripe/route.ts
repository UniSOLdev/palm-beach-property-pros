import { NextResponse } from "next/server";
import { isStripeEnabled } from "@/lib/autopilot/config";
import { paymentIntentId, verifyStripeWebhookSignature } from "@/lib/autopilot/payments/stripe-client";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      metadata?: Record<string, string>;
      payment_intent?: string | { id: string } | null;
      amount_total?: number | null;
    };
  };
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

async function handleCheckoutCompleted(session: StripeEvent["data"]["object"]) {
  const metadata = session.metadata ?? {};
  const paymentLinkId = metadata.payment_link_id;
  const invoiceId = metadata.invoice_id;
  const linkType = metadata.link_type === "deposit" ? "deposit" : "full";

  if (!paymentLinkId || !invoiceId) {
    throw new Error("checkout.session.completed missing invoice_id or payment_link_id metadata");
  }

  const supabase = createServiceClient();
  const paidAt = new Date().toISOString();
  const intentId = paymentIntentId({
    id: session.id,
    url: null,
    payment_intent: session.payment_intent ?? null,
    status: "complete",
    payment_status: "paid",
    metadata,
  });

  const { data: paymentLink, error: linkLookupError } = await supabase
    .from("payment_links")
    .select("id, status, amount_cents")
    .eq("id", paymentLinkId)
    .maybeSingle();

  if (linkLookupError) throw new Error(linkLookupError.message);
  if (!paymentLink) throw new Error(`Payment link ${paymentLinkId} not found`);
  if (paymentLink.status === "paid") return { duplicate: true };

  const { error: linkUpdateError } = await supabase
    .from("payment_links")
    .update({
      status: "paid",
      paid_at: paidAt,
      stripe_payment_intent_id: intentId,
      stripe_checkout_session_id: session.id,
    })
    .eq("id", paymentLinkId);

  if (linkUpdateError) throw new Error(linkUpdateError.message);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, deposit_paid, discount, payment_status")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError) throw new Error(invoiceError.message);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

  const paidAmount = Number(paymentLink.amount_cents ?? session.amount_total ?? 0) / 100;
  const depositPaid = Number(invoice.deposit_paid ?? 0);

  if (linkType === "deposit") {
    const newDepositPaid = depositPaid + paidAmount;
    const { data: items } = await supabase
      .from("invoice_items")
      .select("quantity, unit_price")
      .eq("invoice_id", invoiceId);
    const subtotal = (items ?? []).reduce(
      (sum, line) => sum + Number(line.quantity) * Number(line.unit_price),
      0,
    );
    const totalDue = Math.max(0, subtotal - Number(invoice.discount ?? 0) - newDepositPaid);
    const fullyPaid = totalDue < 0.01;

    const { error: invoiceUpdateError } = await supabase
      .from("invoices")
      .update({
        deposit_paid: newDepositPaid,
        payment_method: "stripe",
        payment_status: fullyPaid ? "Paid" : "Unpaid",
        paid_date: fullyPaid ? todayDateString() : null,
      })
      .eq("id", invoiceId);

    if (invoiceUpdateError) throw new Error(invoiceUpdateError.message);
    return { duplicate: false, linkType, fullyPaid };
  }

  const { error: invoiceUpdateError } = await supabase
    .from("invoices")
    .update({
      payment_status: "Paid",
      paid_date: todayDateString(),
      payment_method: "stripe",
    })
    .eq("id", invoiceId);

  if (invoiceUpdateError) throw new Error(invoiceUpdateError.message);
  return { duplicate: false, linkType, fullyPaid: true };
}

export async function POST(request: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ ok: false, error: "Stripe disabled on free tier" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "STRIPE_WEBHOOK_SECRET not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!verifyStripeWebhookSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const outcome = await handleCheckoutCompleted(event.data.object);
      return NextResponse.json({ ok: true, received: true, ...outcome });
    }

    return NextResponse.json({ ok: true, received: true, ignored: event.type });
  } catch (error) {
    console.error("[PBPP Stripe Webhook]", error);
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
