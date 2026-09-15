import "server-only";
import { isSmsEnabled } from "@/lib/autopilot/config";
import { sendMessage, type SendMessageResult } from "@/lib/autopilot/comms/send";
import { QUOTE_PATH, SITE_URL } from "@/lib/site";

/** Fields needed from a quote_requests row (or equivalent lead payload). */
export type LeadAckInput = {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  /** Alias for service_requested — template uses {{service}}. */
  service_interest?: string | null;
  service_requested?: string | null;
};

export async function sendLeadAcknowledgment(lead: LeadAckInput): Promise<SendMessageResult[]> {
  const service = lead.service_interest ?? lead.service_requested ?? "your project";
  const vars = {
    name: lead.name,
    service,
    quote_url: `${SITE_URL}${QUOTE_PATH}`,
  };

  const entity = lead.id
    ? { entityType: "quote_request" as const, entityId: lead.id }
    : {};

  const results: SendMessageResult[] = [];

  if (lead.email?.trim()) {
    results.push(
      await sendMessage({
        channel: "email",
        templateKey: "lead_ack",
        recipient: lead.email.trim(),
        vars,
        ...entity,
      }),
    );
  }

  if (isSmsEnabled() && lead.phone?.trim()) {
    results.push(
      await sendMessage({
        channel: "sms",
        templateKey: "lead_ack",
        recipient: lead.phone.trim(),
        vars,
        ...entity,
      }),
    );
  }

  return results;
}
