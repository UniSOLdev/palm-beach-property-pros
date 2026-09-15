import type { AutopilotTierSummary } from "@/lib/autopilot/config";
import type { AutomationRunRow, CommsLogRow } from "@/lib/autopilot/types";

export type TaskRuleSummary = {
  id: string;
  rule_key: string;
  name: string;
  enabled: boolean;
  category: string;
  priority: string;
};

export type CronJobSummary = {
  key: string;
  label: string;
  schedule: string;
  description: string;
};

export type AutopilotDashboardData = {
  recentRuns: AutomationRunRow[];
  lastRunByJob: Record<string, AutomationRunRow | null>;
  taskRules: TaskRuleSummary[];
  commsLog: CommsLogRow[];
  pendingOutreachCount: number;
  pendingContentDraftsCount: number;
  receptionistSessionsToday: number;
  cronJobs: CronJobSummary[];
  hasContentPage: boolean;
  tierSummary: AutopilotTierSummary;
};

export const AUTOPILOT_CRON_JOBS: CronJobSummary[] = [
  {
    key: "ops",
    label: "Daily ops",
    schedule: "Daily 6:00 AM",
    description: "Inventory, leads, jobs, and invoice task rules",
  },
  {
    key: "ops-hourly",
    label: "Hourly ops",
    schedule: "Every hour",
    description: "Lead SLA and urgent rule checks",
  },
  {
    key: "comms",
    label: "Comms queue",
    schedule: "Every 15 min",
    description: "Send queued emails (SMS on paid tier only)",
  },
  {
    key: "outreach",
    label: "Outreach",
    schedule: "Weekdays 9:00 AM",
    description: "B2B sequence enrollments and follow-ups",
  },
  {
    key: "content",
    label: "Content autopilot",
    schedule: "Mondays 8:00 AM",
    description: "Generate website content drafts",
  },
  {
    key: "digest",
    label: "Weekly digest",
    schedule: "Mondays 7:00 AM",
    description: "Ops summary email to admin",
  },
];

/** Maps dashboard cron keys to automation_runs.job_key values. */
export const CRON_JOB_RUN_KEYS: Record<string, string[]> = {
  ops: ["ops", "ops-daily"],
  "ops-hourly": ["ops-hourly"],
  comms: ["comms"],
  outreach: ["outreach"],
  content: ["content", "content_weekly"],
  digest: ["digest"],
};
