import "server-only";
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { JOB_CHECKLIST_ITEMS } from "@/lib/admin/task-constants";
import type { TaskPriority } from "@/lib/admin/task-constants";

export const TASK_RULE_KEYS = [
  "low_stock_reorder",
  "lead_sla_breach",
  "quote_follow_up",
  "invoice_overdue",
  "job_prep_tomorrow",
  "outreach_follow_up_due",
  "crew_payout_review",
] as const;

export type TaskRuleKey = (typeof TASK_RULE_KEYS)[number];

export type TaskRuleCandidate = {
  entityType: string;
  entityId: string;
  title: string;
  description?: string | null;
  category?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  jobId?: string | null;
  clientId?: string | null;
  invoiceId?: string | null;
  entityUpdatedAt?: string | null;
  bulkItems?: { title: string; category: string; priority: TaskPriority }[];
};

export type RuleEvalResult = {
  candidates: TaskRuleCandidate[];
  errors: string[];
};

function isoDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function mondayOfWeekUtc(d = new Date()): string {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  return isoDate(monday);
}

export function weekEntityId(weekStart: string): string {
  const hash = createHash("sha256").update(`pbpp-week:${weekStart}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function evalLowStockReorder(supabase: SupabaseClient): Promise<RuleEvalResult> {
  const errors: string[] = [];
  const { data, error } = await supabase
    .from("supplies")
    .select("id, name, quantity, reorder_level, unit, updated_at")
    .eq("archived", false);

  if (error) return { candidates: [], errors: [error.message] };

  const candidates: TaskRuleCandidate[] = (data ?? [])
    .filter((row) => row.quantity <= row.reorder_level)
    .map((row) => ({
      entityType: "supply",
      entityId: row.id,
      title: `Reorder: ${row.name}`,
      description: `Stock is ${row.quantity} ${row.unit} (reorder at ${row.reorder_level}).`,
      category: "Supply Restock",
      entityUpdatedAt: row.updated_at,
    }));

  return { candidates, errors };
}

export async function evalLeadSlaBreach(supabase: SupabaseClient): Promise<RuleEvalResult> {
  const errors: string[] = [];
  const { data: leads, error } = await supabase
    .from("quote_requests")
    .select("id, name, service_requested, phone, created_at, updated_at, client_id")
    .eq("status", "new")
    .eq("archived", false)
    .lt("created_at", hoursAgo(2));

  if (error) return { candidates: [], errors: [error.message] };
  if (!leads?.length) return { candidates: [], errors };

  const leadIds = leads.map((l) => l.id);
  const { data: activities, error: actErr } = await supabase
    .from("quote_request_activity")
    .select("quote_request_id")
    .in("quote_request_id", leadIds);

  if (actErr) return { candidates: [], errors: [actErr.message] };

  const touched = new Set((activities ?? []).map((a) => a.quote_request_id));
  const candidates: TaskRuleCandidate[] = leads
    .filter((lead) => !touched.has(lead.id))
    .map((lead) => ({
      entityType: "quote_request",
      entityId: lead.id,
      title: `SLA breach: ${lead.name} — ${lead.service_requested}`,
      description: `New lead untouched for 2+ hours. Phone: ${lead.phone}.`,
      category: "Quote Follow-Up",
      priority: "urgent",
      clientId: lead.client_id,
      entityUpdatedAt: lead.updated_at,
    }));

  return { candidates, errors };
}

export async function evalQuoteFollowUp(supabase: SupabaseClient): Promise<RuleEvalResult> {
  const errors: string[] = [];
  const cutoff = daysAgo(3);
  const { data, error } = await supabase
    .from("quotes")
    .select("id, quote_number, client_id, service_type, job_address, sent_at, created_at")
    .eq("status", "sent")
    .eq("archived", false);

  if (error) return { candidates: [], errors: [error.message] };

  const candidates: TaskRuleCandidate[] = (data ?? [])
    .filter((row) => {
      const anchor = row.sent_at ?? row.created_at;
      return anchor < cutoff;
    })
    .map((row) => ({
      entityType: "quote",
      entityId: row.id,
      title: `Follow up quote #${row.quote_number}`,
      description: `${row.service_type} at ${row.job_address} — sent 3+ days ago with no response.`,
      category: "Quote Follow-Up",
      clientId: row.client_id,
      entityUpdatedAt: row.sent_at ?? row.created_at,
    }));

  return { candidates, errors };
}

export async function evalInvoiceOverdue(supabase: SupabaseClient): Promise<RuleEvalResult> {
  const errors: string[] = [];
  const today = isoDate();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, client_id, job_id, due_date, payment_status, created_at")
    .eq("archived", false)
    .neq("payment_status", "Paid")
    .not("due_date", "is", null)
    .lt("due_date", today);

  if (error) return { candidates: [], errors: [error.message] };

  const candidates: TaskRuleCandidate[] = (data ?? []).map((row) => ({
    entityType: "invoice",
    entityId: row.id,
    title: `Overdue invoice #${row.invoice_number}`,
    description: `Payment status: ${row.payment_status}. Due ${row.due_date}.`,
    category: "Invoice Follow-Up",
    clientId: row.client_id,
    jobId: row.job_id,
    invoiceId: row.id,
    dueDate: row.due_date,
    entityUpdatedAt: row.created_at,
  }));

  return { candidates, errors };
}

export async function evalJobPrepTomorrow(supabase: SupabaseClient): Promise<RuleEvalResult> {
  const errors: string[] = [];
  const tomorrow = isoDate(addDays(new Date(), 1));
  const { data, error } = await supabase
    .from("jobs")
    .select("id, address, service_type, client_id, job_date")
    .eq("archived", false)
    .eq("job_date", tomorrow);

  if (error) return { candidates: [], errors: [error.message] };

  const candidates: TaskRuleCandidate[] = (data ?? []).map((job) => ({
    entityType: "job",
    entityId: job.id,
    title: `Prep job tomorrow: ${job.service_type} — ${job.address}`,
    description: `Job scheduled ${job.job_date}. Spawn checklist prep tasks.`,
    category: "Job Follow-Up",
    jobId: job.id,
    clientId: job.client_id,
    dueDate: job.job_date,
    bulkItems: JOB_CHECKLIST_ITEMS.map((item) => ({
      title: item.title,
      category: item.category,
      priority: item.priority,
    })),
  }));

  return { candidates, errors };
}

export async function evalOutreachFollowUpDue(supabase: SupabaseClient): Promise<RuleEvalResult> {
  const errors: string[] = [];
  const today = isoDate();
  const { data, error } = await supabase
    .from("outreach_prospects")
    .select("id, company_name, contact_name, prospect_type, status, next_follow_up, updated_at")
    .eq("archived", false)
    .not("next_follow_up", "is", null)
    .lte("next_follow_up", today)
    .not("status", "in", '("won","lost")');

  if (error) return { candidates: [], errors: [error.message] };

  const candidates: TaskRuleCandidate[] = (data ?? []).map((row) => ({
    entityType: "outreach_prospect",
    entityId: row.id,
    title: `Outreach follow-up: ${row.company_name}`,
    description: row.contact_name
      ? `Contact: ${row.contact_name} (${row.prospect_type}). Follow-up due ${row.next_follow_up}.`
      : `Prospect type: ${row.prospect_type}. Follow-up due ${row.next_follow_up}.`,
    category: "Marketing",
    entityUpdatedAt: row.updated_at,
  }));

  return { candidates, errors };
}

export async function evalCrewPayoutReview(supabase: SupabaseClient): Promise<RuleEvalResult> {
  const errors: string[] = [];
  const now = new Date();
  if (now.getUTCDay() !== 1) {
    return { candidates: [], errors };
  }

  const weekStart = mondayOfWeekUtc(now);
  const entityId = weekEntityId(weekStart);

  const { data: existing, error } = await supabase
    .from("task_rule_firings")
    .select("id")
    .eq("rule_key", "crew_payout_review")
    .eq("entity_type", "week")
    .eq("entity_id", entityId)
    .maybeSingle();

  if (error) return { candidates: [], errors: [error.message] };
  if (existing) return { candidates: [], errors };

  return {
    candidates: [
      {
        entityType: "week",
        entityId,
        title: "Weekly crew payout review",
        description: `Review crew payouts for week starting ${weekStart}.`,
        category: "Crew/Admin",
        dueDate: weekStart,
      },
    ],
    errors,
  };
}

export const RULE_EVALUATORS: Record<
  TaskRuleKey,
  (supabase: SupabaseClient) => Promise<RuleEvalResult>
> = {
  low_stock_reorder: evalLowStockReorder,
  lead_sla_breach: evalLeadSlaBreach,
  quote_follow_up: evalQuoteFollowUp,
  invoice_overdue: evalInvoiceOverdue,
  job_prep_tomorrow: evalJobPrepTomorrow,
  outreach_follow_up_due: evalOutreachFollowUpDue,
  crew_payout_review: evalCrewPayoutReview,
};
