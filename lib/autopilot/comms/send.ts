import "server-only";
import { renderTemplate } from "@/lib/autopilot/comms/template-render";
import { sendResendEmail } from "@/lib/autopilot/comms/providers/resend";
import { sendTwilioSms } from "@/lib/autopilot/comms/providers/twilio";
import type { CommsChannel, CommsStatus, MessageTemplateRow } from "@/lib/autopilot/types";
import { createServiceClient } from "@/lib/supabase/service";

const BODY_PREVIEW_MAX = 240;

export type SendMessageInput = {
  channel: CommsChannel;
  templateKey: string;
  recipient: string;
  vars?: Record<string, string>;
  entityType?: string;
  entityId?: string;
};

export type SendMessageResult = {
  ok: boolean;
  status: CommsStatus;
  logId: string;
  providerId?: string;
  error?: string;
};

function bodyPreview(body: string): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  return trimmed.length <= BODY_PREVIEW_MAX ? trimmed : `${trimmed.slice(0, BODY_PREVIEW_MAX)}…`;
}

async function updateCommsLog(
  logId: string,
  patch: {
    status: CommsStatus;
    provider_id?: string | null;
    error?: string | null;
    sent_at?: string | null;
  },
) {
  const supabase = createServiceClient();
  await supabase.from("comms_log").update(patch).eq("id", logId);
}

export async function sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
  const supabase = createServiceClient();
  const vars = input.vars ?? {};

  const { data: template, error: templateError } = await supabase
    .from("message_templates")
    .select("id, template_key, channel, name, subject, body, variables, enabled")
    .eq("template_key", input.templateKey)
    .eq("channel", input.channel)
    .maybeSingle();

  if (templateError) {
    throw new Error(templateError.message);
  }

  const row = template as MessageTemplateRow | null;
  if (!row?.enabled) {
    const { data: skippedLog, error: skipError } = await supabase
      .from("comms_log")
      .insert({
        channel: input.channel,
        template_key: input.templateKey,
        recipient: input.recipient,
        status: "skipped" as CommsStatus,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        error: row ? "Template disabled" : "Template not found",
        metadata: { vars },
      })
      .select("id")
      .single();

    if (skipError) throw new Error(skipError.message);

    return {
      ok: false,
      status: "skipped",
      logId: skippedLog.id,
      error: row ? "Template disabled" : "Template not found",
    };
  }

  const renderedBody = renderTemplate(row.body, vars);
  const renderedSubject =
    input.channel === "email" && row.subject ? renderTemplate(row.subject, vars) : null;

  const { data: queuedLog, error: queueError } = await supabase
    .from("comms_log")
    .insert({
      channel: input.channel,
      template_key: input.templateKey,
      recipient: input.recipient,
      subject: renderedSubject,
      body_preview: bodyPreview(renderedBody),
      status: "queued" as CommsStatus,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: { vars, renderedSubject, renderedBody },
    })
    .select("id")
    .single();

  if (queueError) throw new Error(queueError.message);

  const logId = queuedLog.id as string;
  const sentAt = new Date().toISOString();

  if (input.channel === "email") {
    const result = await sendResendEmail({
      to: input.recipient,
      subject: renderedSubject ?? row.name,
      body: renderedBody,
    });

    if (!result.ok) {
      const status: CommsStatus = result.skipped ? "skipped" : "failed";
      await updateCommsLog(logId, { status, error: result.error, sent_at: sentAt });
      return { ok: false, status, logId, error: result.error };
    }

    await updateCommsLog(logId, {
      status: "sent",
      provider_id: result.id,
      error: null,
      sent_at: sentAt,
    });
    return { ok: true, status: "sent", logId, providerId: result.id };
  }

  const smsResult = await sendTwilioSms({ to: input.recipient, body: renderedBody });

  if (!smsResult.ok) {
    const status: CommsStatus = smsResult.skipped ? "skipped" : "failed";
    await updateCommsLog(logId, { status, error: smsResult.error, sent_at: sentAt });
    return { ok: false, status, logId, error: smsResult.error };
  }

  await updateCommsLog(logId, {
    status: "sent",
    provider_id: smsResult.sid,
    error: null,
    sent_at: sentAt,
  });
  return { ok: true, status: "sent", logId, providerId: smsResult.sid };
}

/** Retry comms_log rows stuck in `queued` (e.g. prior crash mid-send). */
export async function processQueuedComms(limit = 50): Promise<{
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}> {
  const supabase = createServiceClient();
  const { data: queued, error } = await supabase
    .from("comms_log")
    .select("id, channel, template_key, recipient, metadata")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return { sent: 0, skipped: 0, failed: 0, errors: [error.message] };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of queued ?? []) {
    const metadata = (row.metadata ?? {}) as {
      vars?: Record<string, string>;
      renderedSubject?: string | null;
      renderedBody?: string;
    };

    if (!metadata.renderedBody || !row.template_key) {
      await updateCommsLog(row.id, {
        status: "failed",
        error: "Missing rendered body in metadata",
        sent_at: new Date().toISOString(),
      });
      failed += 1;
      errors.push(`comms_log ${row.id}: missing rendered body`);
      continue;
    }

    const sentAt = new Date().toISOString();

    if (row.channel === "email") {
      const result = await sendResendEmail({
        to: row.recipient,
        subject: metadata.renderedSubject ?? row.template_key,
        body: metadata.renderedBody,
      });

      if (!result.ok) {
        const status: CommsStatus = result.skipped ? "skipped" : "failed";
        await updateCommsLog(row.id, { status, error: result.error, sent_at: sentAt });
        if (result.skipped) skipped += 1;
        else {
          failed += 1;
          errors.push(result.error ?? "Email send failed");
        }
        continue;
      }

      await updateCommsLog(row.id, {
        status: "sent",
        provider_id: result.id,
        error: null,
        sent_at: sentAt,
      });
      sent += 1;
      continue;
    }

    const smsResult = await sendTwilioSms({ to: row.recipient, body: metadata.renderedBody });

    if (!smsResult.ok) {
      const status: CommsStatus = smsResult.skipped ? "skipped" : "failed";
      await updateCommsLog(row.id, { status, error: smsResult.error, sent_at: sentAt });
      if (smsResult.skipped) skipped += 1;
      else {
        failed += 1;
        errors.push(smsResult.error ?? "SMS send failed");
      }
      continue;
    }

    await updateCommsLog(row.id, {
      status: "sent",
      provider_id: smsResult.sid,
      error: null,
      sent_at: sentAt,
    });
    sent += 1;
  }

  return { sent, skipped, failed, errors };
}

/** Raw email send (no template) — used by outreach approval flow. */
export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  entityType: string;
  entityId: string;
  templateKey?: string;
}): Promise<{ providerId: string | null }> {
  const supabase = createServiceClient();
  const sentAt = new Date().toISOString();

  const { data: queuedLog, error: queueError } = await supabase
    .from("comms_log")
    .insert({
      channel: "email",
      template_key: params.templateKey ?? null,
      recipient: params.to,
      subject: params.subject,
      body_preview: bodyPreview(params.body),
      status: "queued" as CommsStatus,
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata: { renderedSubject: params.subject, renderedBody: params.body },
    })
    .select("id")
    .single();

  if (queueError) throw new Error(queueError.message);

  const logId = queuedLog.id as string;
  const result = await sendResendEmail({
    to: params.to,
    subject: params.subject,
    body: params.body,
  });

  if (!result.ok) {
    const status: CommsStatus = result.skipped ? "skipped" : "failed";
    await updateCommsLog(logId, { status, error: result.error, sent_at: sentAt });
    if (result.skipped) return { providerId: null };
    throw new Error(result.error ?? "Email send failed");
  }

  await updateCommsLog(logId, {
    status: "sent",
    provider_id: result.id,
    error: null,
    sent_at: sentAt,
  });

  return { providerId: result.id ?? null };
}
