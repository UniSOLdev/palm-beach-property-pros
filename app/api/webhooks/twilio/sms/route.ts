import { isSmsEnabled } from "@/lib/autopilot/config";
import { classifySmsIntent } from "@/lib/autopilot/receptionist/intent-classifier";
import {
  createLeadFromSms,
  parseSmsForLead,
  smsHasLeadSignals,
} from "@/lib/autopilot/receptionist/lead-from-sms";
import {
  findOpenSessionForNumber,
  logReceptionistSession,
  parseTwilioForm,
  smsPromptForMissingLeadFields,
  smsReplyForIntent,
  smsResponse,
  updateReceptionistSession,
  validateTwilioSignature,
} from "@/lib/autopilot/receptionist/responses";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";

export const runtime = "nodejs";

const WEBHOOK_PATH = "/api/webhooks/twilio/sms";

/** POST /api/webhooks/twilio/sms — inbound SMS from Twilio. */
export async function POST(request: Request) {
  if (!isSmsEnabled()) {
    return new Response("SMS receptionist disabled on free tier", { status: 503 });
  }

  try {
    const params = await parseTwilioForm(request);
    const auth = validateTwilioSignature(request, params, WEBHOOK_PATH);
    if (!auth.ok) {
      return new Response("Unauthorized", { status: 403 });
    }

    const from = params.From ?? "";
    const to = params.To ?? "";
    const body = (params.Body ?? "").trim();
    const messageSid = params.MessageSid ?? params.SmsSid ?? null;

    if (!from || !body) {
      return smsResponse("Thanks for contacting Palm Beach Property Pros. How can we help you today?");
    }

    const existingSession = await findOpenSessionForNumber(from);
    const isFirstMessage = !existingSession;

    let intent = existingSession?.intent ?? null;
    if (isFirstMessage) {
      const classification = await classifySmsIntent(body);
      intent = classification.intent;
    }

    const parsed = parseSmsForLead(body);
    let leadCreated = false;
    let quoteRequestId = existingSession?.quote_request_id ?? null;

    if (smsHasLeadSignals(parsed) && !quoteRequestId) {
      const leadResult = await createLeadFromSms(from, body, parsed);
      if (leadResult.ok) {
        leadCreated = true;
        quoteRequestId = leadResult.quoteRequestId;
      }
    }

    const replyBody = leadCreated
      ? smsReplyForIntent((intent as "quote" | "emergency" | "status" | "general") ?? "quote", {
          leadCreated: true,
        })
      : smsHasLeadSignals(parsed)
        ? smsReplyForIntent((intent as "quote" | "emergency" | "status" | "general") ?? "general", {
            leadCreated: false,
          })
        : isFirstMessage
          ? smsReplyForIntent(
              (intent as "quote" | "emergency" | "status" | "general") ?? "general",
            )
          : smsPromptForMissingLeadFields(parsed);

    if (existingSession) {
      await updateReceptionistSession(existingSession.id, {
        intent,
        quoteRequestId,
        status: leadCreated ? "qualified" : "open",
        transcript: body,
        metadata: { messageSid, lastReply: replyBody.slice(0, 160) },
      });
    } else {
      await logReceptionistSession({
        channel: "sms",
        fromNumber: from,
        toNumber: to,
        status: leadCreated ? "qualified" : "open",
        transcript: body,
        intent,
        quoteRequestId,
        providerCallId: messageSid,
        metadata: { messageSid, isFirstMessage: true },
      });
    }

    logPipelineInfo("receptionist inbound SMS handled", {
      step: "twilio/sms",
      details: { from, intent, leadCreated, isFirstMessage },
    });

    return smsResponse(replyBody);
  } catch (error) {
    logPipelineError("twilio SMS webhook failed", error, { step: "twilio/sms" });
    return smsResponse(
      "Sorry, we had trouble processing your message. Please call or text 561-629-2617 or visit our quote page.",
    );
  }
}
