import "server-only";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { PHONE_DISPLAY, QUOTE_PATH, SITE_URL } from "@/lib/site";
import type { SmsIntent } from "@/lib/autopilot/receptionist/intent-classifier";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";

export type TwilioParams = Record<string, string>;

export type ReceptionistChannel = "sms" | "voice" | "missed_call";

const MISSED_CALL_FALLBACK =
  "Thanks for calling Palm Beach Property Pros! We missed your call. Reply with your address and what you need help with, or request a quote: {{quote_url}}";

export function quoteUrl(): string {
  return `${SITE_URL}${QUOTE_PATH}`;
}

export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function xmlResponse(twiml: string, status = 200): Response {
  return new Response(twiml, {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export function smsResponse(body: string): Response {
  const escaped = escapeXml(body);
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function emptyTwimlResponse(): Response {
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
}

export function voiceWelcomeTwiml(gatherActionUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thanks for calling Palm Beach Property Pros. For the fastest response, we can text you our quote link, or you can tell us what you need by text at ${PHONE_DISPLAY.replace(/-/g, " ")}.</Say>
  <Gather numDigits="1" action="${escapeXml(gatherActionUrl)}" method="POST" timeout="8">
    <Say voice="Polly.Joanna">Press 1 to receive a text message with our online quote form. Press any other key to hear the quote link.</Say>
  </Gather>
  <Say voice="Polly.Joanna">Visit our website quote page or text us your address and service need. Goodbye.</Say>
</Response>`;
}

export function voiceSendSmsTwiml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We will text you shortly with our quote link. Goodbye.</Say>
</Response>`;
}

export function voiceQuoteLinkTwiml(): string {
  const spoken = quoteUrl().replace(/\//g, " slash ").replace(/\./g, " dot ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Request a quote at ${spoken}. Or text ${PHONE_DISPLAY.replace(/-/g, " ")} with your address and what you need. Goodbye.</Say>
</Response>`;
}

export function smsReplyForIntent(
  intent: SmsIntent,
  context?: { leadCreated?: boolean; quoteUrl?: string },
): string {
  const link = context?.quoteUrl ?? quoteUrl();

  if (context?.leadCreated) {
    return `Thanks! We received your request and will follow up shortly. You can also add photos or details here: ${link} — Palm Beach Property Pros`;
  }

  switch (intent) {
    case "emergency":
      return `We received your message. If this is urgent property damage, reply URGENT with your address. For non-emergencies, request a quote: ${link} — PBPP (${PHONE_DISPLAY})`;
    case "status":
      return `Thanks for checking in. Our team will confirm your appointment or job status shortly. For a new request, use ${link} — Palm Beach Property Pros`;
    case "quote":
      return `Happy to help with a quote! Reply with your property address and what service you need (cleaning, pressure wash, yard, windows, etc.), or use our form: ${link}`;
    case "general":
    default:
      return `Hi! This is Palm Beach Property Pros. Reply with your address and what you need help with, or request a quote: ${link}. Call or text ${PHONE_DISPLAY}.`;
  }
}

export function smsPromptForMissingLeadFields(parsed: {
  address: string | null;
  serviceRequested: string | null;
}): string {
  if (!parsed.address && !parsed.serviceRequested) {
    return `Thanks for texting Palm Beach Property Pros! Send your property address and the service you need (e.g. cleaning, pressure wash, yard maintenance). Or request a quote: ${quoteUrl()}`;
  }
  if (!parsed.address) {
    return `Got it — what is the property address for this ${parsed.serviceRequested} request?`;
  }
  return `Thanks! What service do you need at ${parsed.address}? (cleaning, pressure wash, yard, windows, debris removal, etc.)`;
}

export async function fetchMessageTemplate(
  templateKey: string,
  channel: "sms" | "email" = "sms",
): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("message_templates")
      .select("body")
      .eq("template_key", templateKey)
      .eq("channel", channel)
      .eq("enabled", true)
      .maybeSingle();

    if (error || !data?.body) return null;
    return data.body;
  } catch {
    return null;
  }
}

export async function missedCallSmsBody(): Promise<string> {
  const template = await fetchMessageTemplate("missed_call_sms", "sms");
  return renderTemplate(template ?? MISSED_CALL_FALLBACK, { quote_url: quoteUrl() });
}

export function getWebhookUrl(request: Request, pathname: string): string {
  const base = process.env.TWILIO_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (base) return `${base}${pathname}`;
  return new URL(pathname, request.url).toString();
}

export async function parseTwilioForm(request: Request): Promise<TwilioParams> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    return Object.fromEntries(new URLSearchParams(text).entries());
  }

  const formData = await request.formData();
  const params: TwilioParams = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") params[key] = value;
  });
  return params;
}

/** Validate X-Twilio-Signature when TWILIO_AUTH_TOKEN is set. Skips in dev when token unset. */
export function validateTwilioSignature(
  request: Request,
  params: TwilioParams,
  webhookPath: string,
): { ok: true } | { ok: false; reason: string } {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!authToken) {
    return { ok: true };
  }

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) {
    return { ok: false, reason: "Missing X-Twilio-Signature" };
  }

  const url = getWebhookUrl(request, webhookPath);
  const sortedKeys = Object.keys(params).sort();
  let payload = url;
  for (const key of sortedKeys) {
    payload += key + params[key];
  }

  const expected = crypto.createHmac("sha1", authToken).update(payload, "utf8").digest("base64");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);

  if (expectedBuf.length !== signatureBuf.length || !crypto.timingSafeEqual(expectedBuf, signatureBuf)) {
    return { ok: false, reason: "Invalid Twilio signature" };
  }

  return { ok: true };
}

export async function sendTwilioSms(to: string, body: string): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    return { ok: false, error: "Twilio env not configured" };
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const form = new URLSearchParams({ To: to, From: from, Body: body });

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const data = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) {
      logPipelineError("Twilio outbound SMS failed", new Error(data.message ?? res.statusText), {
        step: "sendTwilioSms",
        details: { status: res.status, to },
      });
      return { ok: false, error: data.message ?? `HTTP ${res.status}` };
    }

    logPipelineInfo("Twilio outbound SMS sent", {
      step: "sendTwilioSms",
      details: { to, sid: data.sid },
    });
    return { ok: true, sid: data.sid };
  } catch (error) {
    logPipelineError("Twilio outbound SMS exception", error, { step: "sendTwilioSms" });
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function logReceptionistSession(input: {
  channel: ReceptionistChannel;
  fromNumber?: string | null;
  toNumber?: string | null;
  status?: "open" | "qualified" | "escalated" | "closed";
  transcript?: string | null;
  summary?: string | null;
  intent?: string | null;
  quoteRequestId?: string | null;
  providerCallId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("receptionist_sessions")
      .insert({
        channel: input.channel,
        direction: "inbound",
        from_number: input.fromNumber ?? null,
        to_number: input.toNumber ?? null,
        status: input.status ?? "open",
        transcript: input.transcript ?? null,
        summary: input.summary ?? null,
        intent: input.intent ?? null,
        quote_request_id: input.quoteRequestId ?? null,
        provider_call_id: input.providerCallId ?? null,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .single();

    if (error) {
      logPipelineError("receptionist session log failed", error, { step: "logReceptionistSession" });
      return null;
    }
    return data.id;
  } catch (error) {
    logPipelineError("receptionist session log exception", error, { step: "logReceptionistSession" });
    return null;
  }
}

export async function findOpenSessionForNumber(fromNumber: string): Promise<{
  id: string;
  intent: string | null;
  quote_request_id: string | null;
} | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("receptionist_sessions")
      .select("id, intent, quote_request_id")
      .eq("from_number", fromNumber)
      .eq("status", "open")
      .eq("channel", "sms")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function updateReceptionistSession(
  sessionId: string,
  patch: {
    intent?: string | null;
    quoteRequestId?: string | null;
    status?: "open" | "qualified" | "escalated" | "closed";
    transcript?: string | null;
    summary?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const supabase = createServiceClient();
    const update: Record<string, unknown> = {};
    if (patch.intent !== undefined) update.intent = patch.intent;
    if (patch.quoteRequestId !== undefined) update.quote_request_id = patch.quoteRequestId;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.transcript !== undefined) update.transcript = patch.transcript;
    if (patch.summary !== undefined) update.summary = patch.summary;
    if (patch.metadata !== undefined) update.metadata = patch.metadata;

    await supabase.from("receptionist_sessions").update(update).eq("id", sessionId);
  } catch (error) {
    logPipelineError("receptionist session update failed", error, {
      step: "updateReceptionistSession",
      details: { sessionId },
    });
  }
}
