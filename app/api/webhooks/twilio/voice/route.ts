import { isSmsEnabled } from "@/lib/autopilot/config";
import {
  getWebhookUrl,
  logReceptionistSession,
  parseTwilioForm,
  quoteUrl,
  sendTwilioSms,
  validateTwilioSignature,
  voiceQuoteLinkTwiml,
  voiceSendSmsTwiml,
  voiceWelcomeTwiml,
  xmlResponse,
} from "@/lib/autopilot/receptionist/responses";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";

export const runtime = "nodejs";

const WEBHOOK_PATH = "/api/webhooks/twilio/voice";

/** POST /api/webhooks/twilio/voice — inbound voice call from Twilio. */
export async function POST(request: Request) {
  if (!isSmsEnabled()) {
    return new Response("Voice receptionist disabled on free tier", { status: 503 });
  }

  try {
    const params = await parseTwilioForm(request);
    const auth = validateTwilioSignature(request, params, WEBHOOK_PATH);
    if (!auth.ok) {
      return new Response("Unauthorized", { status: 403 });
    }

    const from = params.From ?? "";
    const to = params.To ?? "";
    const callSid = params.CallSid ?? null;
    const digits = params.Digits?.trim();

    if (digits === "1" && from) {
      const smsBody = `Thanks for calling Palm Beach Property Pros! Request a quote here: ${quoteUrl()} — reply with your address and service need anytime.`;
      await sendTwilioSms(from, smsBody);

      await logReceptionistSession({
        channel: "voice",
        fromNumber: from,
        toNumber: to,
        status: "closed",
        summary: "Caller pressed 1 — quote link SMS sent",
        providerCallId: callSid,
        metadata: { digits, smsSent: true },
      });

      logPipelineInfo("receptionist voice gather — SMS sent", {
        step: "twilio/voice",
        details: { from, digits },
      });

      return xmlResponse(voiceSendSmsTwiml());
    }

    if (digits && digits !== "1") {
      await logReceptionistSession({
        channel: "voice",
        fromNumber: from,
        toNumber: to,
        status: "closed",
        summary: "Caller heard quote link",
        providerCallId: callSid,
        metadata: { digits },
      });
      return xmlResponse(voiceQuoteLinkTwiml());
    }

    await logReceptionistSession({
      channel: "voice",
      fromNumber: from,
      toNumber: to,
      status: "open",
      summary: "Inbound voice call — IVR greeting",
      providerCallId: callSid,
      metadata: { phase: "welcome" },
    });

    const gatherActionUrl = getWebhookUrl(request, WEBHOOK_PATH);
    return xmlResponse(voiceWelcomeTwiml(gatherActionUrl));
  } catch (error) {
    logPipelineError("twilio voice webhook failed", error, { step: "twilio/voice" });
    return xmlResponse(voiceQuoteLinkTwiml());
  }
}
