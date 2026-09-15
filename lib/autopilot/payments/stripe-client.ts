import "server-only";
import crypto from "crypto";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_intent: string | { id: string } | null;
  status: string | null;
  payment_status: string | null;
  metadata?: Record<string, string>;
};

export type CreateCheckoutSessionInput = {
  amountCents: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  description: string;
  customerEmail?: string | null;
  metadata?: Record<string, string>;
  expiresAt?: number;
};

function stripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key || null;
}

export function isStripeConfigured(): boolean {
  return Boolean(stripeSecretKey());
}

function encodeFormBody(params: Record<string, string | number | undefined>): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    body.append(key, String(value));
  }
  return body.toString();
}

async function stripeRequest<T>(method: "GET" | "POST", path: string, body?: string): Promise<T> {
  const key = stripeSecretKey();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe request failed (${response.status})`);
  }
  return payload;
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<StripeCheckoutSession> {
  const currency = input.currency ?? "usd";
  const params: Record<string, string | number | undefined> = {
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": currency,
    "line_items[0][price_data][unit_amount]": input.amountCents,
    "line_items[0][price_data][product_data][name]": input.description,
  };

  if (input.customerEmail) {
    params.customer_email = input.customerEmail;
  }
  if (input.expiresAt) {
    params.expires_at = input.expiresAt;
  }
  for (const [key, value] of Object.entries(input.metadata ?? {})) {
    params[`metadata[${key}]`] = value;
    params[`payment_intent_data[metadata[${key}]`] = value;
  }

  return stripeRequest<StripeCheckoutSession>("POST", "/checkout/sessions", encodeFormBody(params));
}

export async function getSession(sessionId: string): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>("GET", `/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  if (!signatureHeader) return false;

  let timestamp: string | undefined;
  const signatures: string[] = [];

  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1" && value) signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return signatures.some((signature) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

export function paymentIntentId(session: StripeCheckoutSession): string | null {
  if (!session.payment_intent) return null;
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;
}
