import "server-only";
import type { OutreachProspectRow } from "@/lib/admin/types-outreach";
import { generatePitchDraft } from "@/lib/autopilot/outreach/pitch-generator";
import type { EngineResult, OutreachSequenceStep } from "@/lib/autopilot/types";
import { createServiceClient } from "@/lib/supabase/service";

export type OutreachSequenceRow = {
  id: string;
  sequence_key: string;
  name: string;
  prospect_type: string | null;
  enabled: boolean;
  steps: OutreachSequenceStep[];
};

export type OutreachEnrollmentRow = {
  id: string;
  prospect_id: string;
  sequence_id: string;
  current_step: number;
  status: string;
  next_action_at: string | null;
  last_action_at: string | null;
  draft_subject: string | null;
  draft_body: string | null;
  approval_status: string;
  created_at: string;
  updated_at: string;
};

export type PendingOutreachDraft = OutreachEnrollmentRow & {
  prospect: OutreachProspectRow;
  sequence: OutreachSequenceRow;
};

const JOB_KEY = "outreach";

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

function parseSteps(raw: unknown): OutreachSequenceStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => s as OutreachSequenceStep)
    .filter((s) => typeof s.step === "number" && typeof s.delay_days === "number");
}

function stepDelay(steps: OutreachSequenceStep[], stepIndex: number): number {
  return steps.find((s) => s.step === stepIndex)?.delay_days ?? 0;
}

function stepTemplate(steps: OutreachSequenceStep[], stepIndex: number): string {
  return steps.find((s) => s.step === stepIndex)?.template ?? "intro";
}

export function computeNextActionAt(steps: OutreachSequenceStep[], stepIndex: number, from = new Date()): string {
  return addDays(from, stepDelay(steps, stepIndex)).toISOString();
}

export async function listPendingOutreachDrafts(): Promise<PendingOutreachDraft[]> {
  const supabase = createServiceClient();

  const { data: enrollments, error } = await supabase
    .from("outreach_enrollments")
    .select("*")
    .eq("status", "active")
    .eq("approval_status", "pending")
    .not("draft_body", "is", null)
    .order("next_action_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!enrollments?.length) return [];

  const prospectIds = [...new Set(enrollments.map((e) => e.prospect_id))];
  const sequenceIds = [...new Set(enrollments.map((e) => e.sequence_id))];

  const [{ data: prospects }, { data: sequences }] = await Promise.all([
    supabase.from("outreach_prospects").select("*").in("id", prospectIds),
    supabase.from("outreach_sequences").select("*").in("id", sequenceIds),
  ]);

  const prospectMap = new Map((prospects ?? []).map((p) => [p.id, p as OutreachProspectRow]));
  const sequenceMap = new Map(
    (sequences ?? []).map((s) => [
      s.id,
      { ...s, steps: parseSteps(s.steps) } as OutreachSequenceRow,
    ]),
  );

  return enrollments
    .filter((e) => prospectMap.has(e.prospect_id) && sequenceMap.has(e.sequence_id))
    .map((e) => ({
      ...(e as OutreachEnrollmentRow),
      prospect: prospectMap.get(e.prospect_id)!,
      sequence: sequenceMap.get(e.sequence_id)!,
    }));
}

export async function enrollProspectInSequence(
  prospectId: string,
  sequenceKey: string,
): Promise<{ enrollmentId: string }> {
  const supabase = createServiceClient();

  const { data: prospect, error: prospectError } = await supabase
    .from("outreach_prospects")
    .select("*")
    .eq("id", prospectId)
    .maybeSingle();

  if (prospectError) throw new Error(prospectError.message);
  if (!prospect) throw new Error("Prospect not found.");
  if (!prospect.email?.trim()) throw new Error("Prospect needs an email to enroll.");

  const { data: sequence, error: seqError } = await supabase
    .from("outreach_sequences")
    .select("*")
    .eq("sequence_key", sequenceKey)
    .maybeSingle();

  if (seqError) throw new Error(seqError.message);
  if (!sequence) throw new Error(`Sequence "${sequenceKey}" not found.`);
  if (!sequence.enabled) throw new Error("Sequence is disabled.");

  const steps = parseSteps(sequence.steps);
  if (!steps.length) throw new Error("Sequence has no steps.");

  const nextActionAt = computeNextActionAt(steps, 0);

  const { data: enrollment, error: enrollError } = await supabase
    .from("outreach_enrollments")
    .upsert(
      {
        prospect_id: prospectId,
        sequence_id: sequence.id,
        current_step: 0,
        status: "active",
        next_action_at: nextActionAt,
        draft_subject: null,
        draft_body: null,
        approval_status: "pending",
      },
      { onConflict: "prospect_id,sequence_id" },
    )
    .select("id")
    .single();

  if (enrollError) throw new Error(enrollError.message);
  return { enrollmentId: enrollment.id };
}

export async function runOutreachEngine(): Promise<EngineResult> {
  const supabase = createServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const result: EngineResult = {
    ok: true,
    jobKey: JOB_KEY,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    details: { enrolled: 0, draftsGenerated: 0 },
  };

  const { data: sequences, error: seqError } = await supabase
    .from("outreach_sequences")
    .select("*")
    .eq("enabled", true);

  if (seqError) {
    result.ok = false;
    result.errors.push(seqError.message);
    return result;
  }

  const sequenceByType = new Map<string, OutreachSequenceRow>();
  for (const raw of sequences ?? []) {
    if (raw.prospect_type) {
      sequenceByType.set(raw.prospect_type, {
        ...raw,
        steps: parseSteps(raw.steps),
      } as OutreachSequenceRow);
    }
  }

  const { data: newProspects, error: prospectError } = await supabase
    .from("outreach_prospects")
    .select("*")
    .eq("status", "new")
    .eq("archived", false)
    .not("email", "is", null);

  if (prospectError) {
    result.errors.push(prospectError.message);
  } else {
    for (const raw of newProspects ?? []) {
      const prospect = raw as OutreachProspectRow;
      if (!prospect.email?.trim()) {
        result.skipped++;
        continue;
      }

      const sequence = sequenceByType.get(prospect.prospect_type);
      if (!sequence) {
        result.skipped++;
        continue;
      }

      const { data: existing } = await supabase
        .from("outreach_enrollments")
        .select("id")
        .eq("prospect_id", prospect.id)
        .eq("sequence_id", sequence.id)
        .maybeSingle();

      if (existing) {
        result.skipped++;
        continue;
      }

      const nextActionAt = computeNextActionAt(sequence.steps, 0, now);

      const { error: insertError } = await supabase.from("outreach_enrollments").insert({
        prospect_id: prospect.id,
        sequence_id: sequence.id,
        current_step: 0,
        status: "active",
        next_action_at: nextActionAt,
        approval_status: "pending",
      });

      if (insertError) {
        result.errors.push(`${prospect.company_name}: ${insertError.message}`);
      } else {
        result.created++;
        (result.details!.enrolled as number)++;
      }
    }
  }

  const { data: dueEnrollments, error: dueError } = await supabase
    .from("outreach_enrollments")
    .select("*")
    .eq("status", "active")
    .eq("approval_status", "pending")
    .lte("next_action_at", nowIso)
    .is("draft_body", null);

  if (dueError) {
    result.errors.push(dueError.message);
    result.ok = result.errors.length === 0;
    return result;
  }

  for (const raw of dueEnrollments ?? []) {
    const enrollment = raw as OutreachEnrollmentRow;

    const [{ data: prospect }, { data: sequenceRaw }] = await Promise.all([
      supabase.from("outreach_prospects").select("*").eq("id", enrollment.prospect_id).maybeSingle(),
      supabase.from("outreach_sequences").select("*").eq("id", enrollment.sequence_id).maybeSingle(),
    ]);

    if (!prospect?.email?.trim() || !sequenceRaw) {
      result.skipped++;
      continue;
    }

    const sequence: OutreachSequenceRow = {
      ...sequenceRaw,
      steps: parseSteps(sequenceRaw.steps),
    } as OutreachSequenceRow;

    const template = stepTemplate(sequence.steps, enrollment.current_step);

    try {
      const draft = await generatePitchDraft({
        prospect: prospect as OutreachProspectRow,
        stepTemplate: template,
        stepIndex: enrollment.current_step,
        sequenceName: sequence.name,
      });

      const { error: updateError } = await supabase
        .from("outreach_enrollments")
        .update({
          draft_subject: draft.subject,
          draft_body: draft.body,
          approval_status: "pending",
        })
        .eq("id", enrollment.id);

      if (updateError) {
        result.errors.push(`${enrollment.id}: ${updateError.message}`);
      } else {
        result.updated++;
        (result.details!.draftsGenerated as number)++;
      }
    } catch (e) {
      result.errors.push(
        `${enrollment.id}: ${e instanceof Error ? e.message : "Draft generation failed"}`,
      );
    }
  }

  result.ok = result.errors.length === 0;
  return result;
}

export async function advanceEnrollmentAfterSend(
  enrollmentId: string,
): Promise<{ completed: boolean; nextStep: number | null }> {
  const supabase = createServiceClient();
  const sentAt = new Date();

  const { data: enrollment, error } = await supabase
    .from("outreach_enrollments")
    .select("*")
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!enrollment) throw new Error("Enrollment not found.");

  const { data: sequenceRaw } = await supabase
    .from("outreach_sequences")
    .select("*")
    .eq("id", enrollment.sequence_id)
    .maybeSingle();

  if (!sequenceRaw) throw new Error("Sequence not found.");

  const steps = parseSteps(sequenceRaw.steps);
  const nextStep = enrollment.current_step + 1;
  const hasNext = steps.some((s) => s.step === nextStep);

  if (!hasNext) {
    await supabase
      .from("outreach_enrollments")
      .update({
        status: "completed",
        approval_status: "sent",
        last_action_at: sentAt.toISOString(),
        draft_subject: null,
        draft_body: null,
        next_action_at: null,
      })
      .eq("id", enrollmentId);

    return { completed: true, nextStep: null };
  }

  await supabase
    .from("outreach_enrollments")
    .update({
      current_step: nextStep,
      status: "active",
      approval_status: "pending",
      last_action_at: sentAt.toISOString(),
      draft_subject: null,
      draft_body: null,
      next_action_at: computeNextActionAt(steps, nextStep, sentAt),
    })
    .eq("id", enrollmentId);

  return { completed: false, nextStep };
}
