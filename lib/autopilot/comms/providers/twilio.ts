import "server-only";
import { isSmsEnabled } from "@/lib/autopilot/config";

export type TwilioSendResult = {
  ok: boolean;
  sid?: string;
  error?: string;
  skipped?: boolean;
};

export function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
}

export function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false as const, error: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER not configured" };
  }
  return { ok: true as const, accountSid, authToken, fromNumber };
}

export async function sendTwilioSms(input: {
  to: string;
  body: string;
}): Promise<TwilioSendResult> {
  if (!isSmsEnabled()) {
    return {
      ok: false,
      error: "SMS disabled (free tier — use email or set AUTOPILOT_TIER=paid + Twilio)",
      skipped: true,
    };
  }

  const config = getTwilioConfig();
  if (!config.ok) {
    return { ok: false, error: config.error, skipped: true };
  }

  const to = normalizePhoneE164(input.to);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: config.fromNumber,
        Body: input.body,
      }),
    });

    const payload = (await response.json()) as { sid?: string; message?: string };

    if (!response.ok) {
      return { ok: false, error: payload.message ?? `Twilio API error (${response.status})` };
    }

    return { ok: true, sid: payload.sid ?? "unknown" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}
