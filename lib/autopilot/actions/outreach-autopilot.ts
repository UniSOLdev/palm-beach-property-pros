"use server";

import { revalidatePath } from "next/cache";
import { sendResendEmail } from "@/lib/autopilot/comms/providers/resend";
import {
  advanceEnrollmentAfterSend,
  enrollProspectInSequence,
  listPendingOutreachDrafts,
} from "@/lib/autopilot/engines/outreach-engine";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
function revalidateOutreach() {
  revalidatePath("/admin/leads/partners");
}

type SendEmailParams = {
  to: string;
  subject: string;
  body: string;
  entityType: string;
  entityId: string;
  templateKey?: string;
};

async function sendOutreachEmail(params: SendEmailParams): Promise<{ providerId: string | null }> {
  const supabase = createServiceClient();
  const sentAt = new Date().toISOString();

  const result = await sendResendEmail({
    to: params.to,
    subject: params.subject,
    body: params.body,
  });

  if (!result.ok) {
    throw new Error(result.error ?? "Email send failed.");
  }

  await supabase.from("comms_log").insert({
    channel: "email",
    template_key: params.templateKey ?? null,
    recipient: params.to,
    subject: params.subject,
    body_preview: params.body.slice(0, 240),
    status: "sent",
    entity_type: params.entityType,
    entity_id: params.entityId,
    provider_id: result.id ?? null,
    sent_at: sentAt,
  });

  return { providerId: result.id ?? null };
}

export async function getPendingOutreachDraftsAction() {
  return listPendingOutreachDrafts();
}

export async function enrollProspect(prospectId: string, sequenceKey: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized.");

  const result = await enrollProspectInSequence(prospectId, sequenceKey);
  revalidateOutreach();
  return result;
}

export async function approveAndSendEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized.");

  const service = createServiceClient();

  const { data: enrollment, error } = await service
    .from("outreach_enrollments")
    .select("*")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!enrollment) throw new Error("Enrollment not found.");
  if (enrollment.approval_status !== "pending") {
    throw new Error("This draft is not pending approval.");
  }
  if (!enrollment.draft_subject?.trim() || !enrollment.draft_body?.trim()) {
    throw new Error("Draft is empty — wait for autopilot to generate it.");
  }

  const { data: prospect } = await service
    .from("outreach_prospects")
    .select("*")
    .eq("id", enrollment.prospect_id)
    .maybeSingle();

  if (!prospect?.email?.trim()) throw new Error("Prospect has no email.");

  await sendOutreachEmail({
    to: prospect.email.trim(),
    subject: enrollment.draft_subject.trim(),
    body: enrollment.draft_body.trim(),
    entityType: "outreach_enrollment",
    entityId: enrollmentId,
    templateKey: "outreach_autopilot",
  });

  const advance = await advanceEnrollmentAfterSend(enrollmentId);

  if (prospect.status === "new") {
    await service.from("outreach_prospects").update({ status: "contacted" }).eq("id", prospect.id);
  }

  revalidateOutreach();
  return { ok: true, completed: advance.completed, nextStep: advance.nextStep };
}

export async function rejectEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized.");

  const service = createServiceClient();
  const { error } = await service
    .from("outreach_enrollments")
    .update({
      approval_status: "rejected",
      draft_subject: null,
      draft_body: null,
      status: "stopped",
    })
    .eq("id", enrollmentId);

  if (error) throw new Error(error.message);
  revalidateOutreach();
  return { ok: true };
}
