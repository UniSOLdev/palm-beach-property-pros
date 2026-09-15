import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { AutomationRunStatus, EngineResult } from "@/lib/autopilot/types";

function todayRunKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function hourRunKey(): string {
  const d = new Date();
  return `${d.toISOString().slice(0, 13)}`; // YYYY-MM-DDTHH
}

export function dailyRunKey() {
  return todayRunKey();
}

export function hourlyRunKey() {
  return hourRunKey();
}

/** 15-minute idempotency slot for comms cron. */
export function commsRunKey(): string {
  const d = new Date();
  const slot = Math.floor(d.getUTCMinutes() / 15);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  return `${d.toISOString().slice(0, 10)}T${hh}:${slot}`;
}

/** Monday date key for weekly digest/content jobs. */
export function mondayRunKey(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export async function beginAutomationRun(jobKey: string, runKey: string) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("automation_runs")
    .select("id, status")
    .eq("job_key", jobKey)
    .eq("run_key", runKey)
    .maybeSingle();

  if (existing?.status === "completed") {
    return { skip: true as const, runId: existing.id };
  }

  const { data, error } = await supabase
    .from("automation_runs")
    .upsert(
      {
        job_key: jobKey,
        run_key: runKey,
        status: "running" as AutomationRunStatus,
        started_at: new Date().toISOString(),
        completed_at: null,
        error: null,
        result: {},
      },
      { onConflict: "job_key,run_key" },
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { skip: false as const, runId: data.id };
}

export async function finishAutomationRun(
  runId: string,
  status: AutomationRunStatus,
  result: EngineResult | Record<string, unknown>,
  error?: string,
) {
  const supabase = createServiceClient();
  await supabase
    .from("automation_runs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      result: result as Record<string, unknown>,
      error: error ?? null,
    })
    .eq("id", runId);
}
