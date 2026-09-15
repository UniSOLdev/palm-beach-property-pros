export type AutomationRunStatus = "running" | "completed" | "failed" | "skipped";

export type AutomationRunRow = {
  id: string;
  job_key: string;
  run_key: string;
  status: AutomationRunStatus;
  started_at: string;
  completed_at: string | null;
  result: Record<string, unknown>;
  error: string | null;
};

export type TaskRuleCategory =
  | "ops"
  | "inventory"
  | "leads"
  | "jobs"
  | "finance"
  | "outreach"
  | "marketing"
  | "growth";

export type CommsChannel = "email" | "sms";

export type CommsStatus = "queued" | "sent" | "delivered" | "failed" | "skipped";

export type MessageTemplateRow = {
  id: string;
  template_key: string;
  channel: CommsChannel;
  name: string;
  subject: string | null;
  body: string;
  variables: string[];
  enabled: boolean;
};

export type CommsLogRow = {
  id: string;
  channel: CommsChannel;
  template_key: string | null;
  recipient: string;
  subject: string | null;
  body_preview: string | null;
  status: CommsStatus;
  entity_type: string | null;
  entity_id: string | null;
  provider_id: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
};

export type OutreachSequenceStep = {
  step: number;
  delay_days: number;
  channel: CommsChannel;
  template: string;
};

export type ContentDraftType =
  | "homepage_section"
  | "project_page"
  | "testimonial"
  | "service_copy"
  | "social_post";

export type EngineResult = {
  ok: boolean;
  jobKey: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  details?: Record<string, unknown>;
};

export type CronJobDefinition = {
  key: string;
  description: string;
  schedule: string;
  run: () => Promise<EngineResult>;
};
