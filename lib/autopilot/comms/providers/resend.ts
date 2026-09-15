import "server-only";

export type ResendSendResult = {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
};

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !fromEmail) {
    return { ok: false as const, error: "RESEND_API_KEY or RESEND_FROM_EMAIL not configured" };
  }
  return { ok: true as const, apiKey, fromEmail };
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<ResendSendResult> {
  const config = getResendConfig();
  if (!config.ok) {
    return { ok: false, error: config.error, skipped: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: [input.to],
        subject: input.subject,
        text: input.body,
      }),
    });

    const payload = (await response.json()) as { id?: string; message?: string };

    if (!response.ok) {
      return { ok: false, error: payload.message ?? `Resend API error (${response.status})` };
    }

    return { ok: true, id: payload.id ?? "unknown" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}
