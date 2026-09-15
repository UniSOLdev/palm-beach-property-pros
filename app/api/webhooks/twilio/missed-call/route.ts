import { isSmsEnabled } from "@/lib/autopilot/config";
import {
  emptyTwimlResponse,
  logReceptionistSession,
  missedCallSmsBody,
  parseTwilioForm,
  sendTwilioSms,
  validateTwilioSignature,
} from "@/lib/autopilot/receptionist/responses";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";

export const runtime = "nodejs";

const WEBHOOK_PATH = "/api/webhooks/twilio/missed-call";

const MISSED_STATUSES = new Set(["no-answer", "busy", "failed", "canceled"]);

/** POST /api/webhooks/twilio/missed-call — missed call status callback → text-back. */
export async function POST(request: Request) {
  if (!isSmsEnabled()) {
    return emptyTwimlResponse();
  }

  try {
    const params = await parseTwilioForm(request);
    const auth = validateTwilioSignature(request, params, WEBHOOK_PATH);
    if (!auth.ok) {
      return new Response("Unauthorized", { status: 403 });
    }

    const from = params.From ?? "";
    const to = params.To ?? "";
    const callSid = params.CallSid ?? params.ParentCallSid ?? null;
    const callStatus = (params.CallStatus ?? params.DialCallStatus ?? "").toLowerCase();

    if (!from) {
      return emptyTwimlResponse();
    }

    if (callStatus && !MISSED_STATUSES.has(callStatus)) {
      logPipelineInfo("receptionist missed-call ignored (not missed)", {
        step: "twilio/missed-call",
        details: { callStatus, from },
      });
      return emptyTwimlResponse();
    }

    const body = await missedCallSmsBody();
    const smsResult = await sendTwilioSms(from, body);

    await logReceptionistSession({
      channel: "missed_call",
      fromNumber: from,
      toNumber: to,
      status: smsResult.ok ? "closed" : "escalated",
      summary: smsResult.ok ? "Missed call text-back sent" : "Missed call text-back failed",
      providerCallId: callSid,
      metadata: {
        callStatus: callStatus || "unknown",
        smsSid: smsResult.sid ?? null,
        smsError: smsResult.error ?? null,
        templateKey: "missed_call_sms",
      },
    });

    logPipelineInfo("receptionist missed call handled", {
      step: "twilio/missed-call",
      details: { from, callStatus, smsOk: smsResult.ok },
    });

    return emptyTwimlResponse();
  } catch (error) {
    logPipelineError("twilio missed-call webhook failed", error, { step: "twilio/missed-call" });
    return emptyTwimlResponse();
  }
}
