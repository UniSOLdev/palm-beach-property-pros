"use server";

import { existsSync } from "fs";
import { join } from "path";
import { revalidatePath } from "next/cache";
import type { EngineResult } from "@/lib/autopilot/types";
import { getAutopilotTierSummary } from "@/lib/autopilot/config";
import {
  AUTOPILOT_CRON_JOBS,
  CRON_JOB_RUN_KEYS,
  type AutopilotDashboardData,
  type TaskRuleSummary,
} from "@/lib/autopilot/dashboard-constants";
import type { AutomationRunRow, CommsLogRow } from "@/lib/autopilot/types";
import { runCommsEngine } from "@/lib/autopilot/engines/comms-engine";
import { runContentEngine } from "@/lib/autopilot/engines/content-engine";
import { runWeeklyOpsDigest } from "@/lib/autopilot/engines/digest-engine";
import { runOutreachEngine } from "@/lib/autopilot/engines/outreach-engine";
import { runDailyOps, runTaskEngine } from "@/lib/autopilot/engines/task-engine";
import {
  commsRunKey,
  dailyRunKey,
  hourlyRunKey,
} from "@/lib/autopilot/run-log";
import { runEngine } from "@/lib/autopilot/runner";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function lastRunForJob(recentRuns: AutomationRunRow[], jobKey: string): AutomationRunRow | null {
  const keys = CRON_JOB_RUN_KEYS[jobKey] ?? [jobKey];
  return recentRuns.find((run) => keys.includes(run.job_key)) ?? null;
}

function contentPageExists() {
  return existsSync(join(process.cwd(), "app/admin/autopilot/content/page.tsx"));
}

export async function getAutopilotDashboard(): Promise<AutopilotDashboardData> {
  const supabase = await createClient();
  const today = todayIsoDate();
  const todayStart = `${today}T00:00:00.000Z`;

  const [
    runsRes,
    rulesRes,
    commsRes,
    outreachRes,
    draftsRes,
    receptionistRes,
  ] = await Promise.all([
    supabase
      .from("automation_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(40),
    supabase
      .from("task_rules")
      .select("id, rule_key, name, enabled, category, priority")
      .order("category")
      .order("name"),
    supabase
      .from("comms_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("outreach_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("approval_status", "pending"),
    supabase
      .from("content_drafts")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "pending_review"]),
    supabase
      .from("receptionist_sessions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
  ]);

  if (runsRes.error) throw new Error(runsRes.error.message);
  if (rulesRes.error) throw new Error(rulesRes.error.message);
  if (commsRes.error) throw new Error(commsRes.error.message);
  if (outreachRes.error) throw new Error(outreachRes.error.message);
  if (draftsRes.error) throw new Error(draftsRes.error.message);
  if (receptionistRes.error) throw new Error(receptionistRes.error.message);

  const recentRuns = (runsRes.data ?? []) as AutomationRunRow[];
  const lastRunByJob: Record<string, AutomationRunRow | null> = {};

  for (const job of AUTOPILOT_CRON_JOBS) {
    lastRunByJob[job.key] = lastRunForJob(recentRuns, job.key);
  }

  return {
    recentRuns,
    lastRunByJob,
    taskRules: (rulesRes.data ?? []) as TaskRuleSummary[],
    commsLog: (commsRes.data ?? []) as CommsLogRow[],
    pendingOutreachCount: outreachRes.count ?? 0,
    pendingContentDraftsCount: draftsRes.count ?? 0,
    receptionistSessionsToday: receptionistRes.count ?? 0,
    cronJobs: AUTOPILOT_CRON_JOBS,
    hasContentPage: contentPageExists(),
    tierSummary: getAutopilotTierSummary(),
  };
}

/** Mirrors cron route wrappers so manual Run now logs the same way as scheduled jobs. */
function loadEngineRunner(jobKey: string): (() => Promise<EngineResult>) | null {
  switch (jobKey) {
    case "digest":
      return () => runWeeklyOpsDigest();
    case "ops":
      return () => runEngine("ops-daily", dailyRunKey(), () => runDailyOps());
    case "ops-hourly":
      return () =>
        runEngine("ops-hourly", hourlyRunKey(), () =>
          runTaskEngine({ rules: ["lead_sla_breach"] }),
        );
    case "comms":
      return () => runEngine("comms", commsRunKey(), runCommsEngine);
    case "outreach":
      return () => runEngine("outreach", dailyRunKey(), runOutreachEngine);
    case "content":
      return () => runContentEngine();
    default:
      return null;
  }
}

export async function runAutopilotJob(jobKey: string): Promise<EngineResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const runner = loadEngineRunner(jobKey);
  if (!runner) {
    return {
      ok: false,
      jobKey,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [`Engine not available for job "${jobKey}"`],
    };
  }

  const result = await runner();
  revalidatePath("/admin/autopilot");
  return result;
}

/** Service-role read for cron observability panels (same shape as dashboard). */
export async function getAutopilotDashboardService(): Promise<AutopilotDashboardData> {
  const supabase = createServiceClient();
  const today = todayIsoDate();
  const todayStart = `${today}T00:00:00.000Z`;

  const [runsRes, rulesRes, commsRes, outreachRes, draftsRes, receptionistRes] =
    await Promise.all([
      supabase
        .from("automation_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(40),
      supabase
        .from("task_rules")
        .select("id, rule_key, name, enabled, category, priority")
        .order("category")
        .order("name"),
      supabase
        .from("comms_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("outreach_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .eq("approval_status", "pending"),
      supabase
        .from("content_drafts")
        .select("id", { count: "exact", head: true })
        .in("status", ["draft", "pending_review"]),
      supabase
        .from("receptionist_sessions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
    ]);

  if (runsRes.error) throw new Error(runsRes.error.message);

  const recentRuns = (runsRes.data ?? []) as AutomationRunRow[];
  const lastRunByJob: Record<string, AutomationRunRow | null> = {};
  for (const job of AUTOPILOT_CRON_JOBS) {
    lastRunByJob[job.key] = lastRunForJob(recentRuns, job.key);
  }

  return {
    recentRuns,
    lastRunByJob,
    taskRules: (rulesRes.data ?? []) as TaskRuleSummary[],
    commsLog: (commsRes.data ?? []) as CommsLogRow[],
    pendingOutreachCount: outreachRes.count ?? 0,
    pendingContentDraftsCount: draftsRes.count ?? 0,
    receptionistSessionsToday: receptionistRes.count ?? 0,
    cronJobs: AUTOPILOT_CRON_JOBS,
    hasContentPage: contentPageExists(),
    tierSummary: getAutopilotTierSummary(),
  };
}
