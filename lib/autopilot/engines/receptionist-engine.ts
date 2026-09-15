import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { CronJobDefinition, EngineResult } from "@/lib/autopilot/types";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";

const JOB_KEY = "receptionist_cleanup";
/** Close open SMS/voice sessions with no activity after this many hours. */
const STALE_SESSION_HOURS = 72;

export async function runReceptionistEngine(): Promise<EngineResult> {
  const result: EngineResult = {
    ok: true,
    jobKey: JOB_KEY,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const supabase = createServiceClient();
    const cutoff = new Date(Date.now() - STALE_SESSION_HOURS * 60 * 60 * 1000).toISOString();

    const { data: stale, error: selectError } = await supabase
      .from("receptionist_sessions")
      .select("id")
      .eq("status", "open")
      .lt("updated_at", cutoff);

    if (selectError) {
      result.ok = false;
      result.errors.push(selectError.message);
      return result;
    }

    if (!stale?.length) {
      result.skipped = 1;
      result.details = { reason: "no_stale_sessions", cutoff };
      return result;
    }

    const ids = stale.map((row) => row.id);
    const { error: updateError } = await supabase
      .from("receptionist_sessions")
      .update({
        status: "closed",
        summary: `Auto-closed after ${STALE_SESSION_HOURS}h inactivity`,
      })
      .in("id", ids);

    if (updateError) {
      result.ok = false;
      result.errors.push(updateError.message);
      return result;
    }

    result.updated = ids.length;
    result.details = { closedSessionIds: ids.length, cutoff };

    logPipelineInfo("receptionist engine closed stale sessions", {
      step: "receptionist-engine",
      details: { count: ids.length, cutoff },
    });
  } catch (error) {
    result.ok = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
    logPipelineError("receptionist engine failed", error, { step: "receptionist-engine" });
  }

  return result;
}

export const receptionistCronJob: CronJobDefinition = {
  key: JOB_KEY,
  description: "Close stale open AI receptionist sessions",
  schedule: "0 6 * * *",
  run: runReceptionistEngine,
};
