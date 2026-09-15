import "server-only";
import { beginAutomationRun, finishAutomationRun } from "@/lib/autopilot/run-log";
import type { EngineResult } from "@/lib/autopilot/types";

export async function runEngine(
  jobKey: string,
  runKey: string,
  fn: () => Promise<EngineResult>,
): Promise<EngineResult> {
  const begun = await beginAutomationRun(jobKey, runKey);
  if (begun.skip) {
    return {
      ok: true,
      jobKey,
      created: 0,
      updated: 0,
      skipped: 1,
      errors: [],
      details: { reason: "already_completed", runKey },
    };
  }

  try {
    const result = await fn();
    await finishAutomationRun(begun.runId, result.ok ? "completed" : "failed", result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed: EngineResult = {
      ok: false,
      jobKey,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [message],
    };
    await finishAutomationRun(begun.runId, "failed", failed, message);
    return failed;
  }
}
