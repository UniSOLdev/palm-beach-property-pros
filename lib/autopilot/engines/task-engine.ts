import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RULE_EVALUATORS,
  TASK_RULE_KEYS,
  type TaskRuleCandidate,
  type TaskRuleKey,
} from "@/lib/autopilot/rules/task-rules";
import type { EngineResult } from "@/lib/autopilot/types";
import type { TaskPriority } from "@/lib/admin/task-constants";
import { createServiceClient } from "@/lib/supabase/service";

type TaskRuleRow = {
  rule_key: string;
  enabled: boolean;
  priority: string;
  cooldown_hours: number;
};

type TaskRuleFiringRow = {
  fired_at: string;
  task_id: string | null;
};

async function nextSortOrder(supabase: SupabaseClient): Promise<number> {
  const { data } = await supabase
    .from("tasks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

async function loadTaskRules(supabase: SupabaseClient): Promise<Map<string, TaskRuleRow>> {
  const { data, error } = await supabase.from("task_rules").select("rule_key, enabled, priority, cooldown_hours");
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.rule_key, row as TaskRuleRow]));
}

async function getLastFiring(
  supabase: SupabaseClient,
  ruleKey: string,
  entityType: string,
  entityId: string,
): Promise<TaskRuleFiringRow | null> {
  const { data, error } = await supabase
    .from("task_rule_firings")
    .select("fired_at, task_id")
    .eq("rule_key", ruleKey)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as TaskRuleFiringRow | null) ?? null;
}

function entityChangedSinceFire(entityUpdatedAt: string | null | undefined, firedAt: string): boolean {
  if (!entityUpdatedAt) return false;
  return new Date(entityUpdatedAt) > new Date(firedAt);
}

function withinCooldown(firedAt: string, cooldownHours: number): boolean {
  const expires = new Date(firedAt).getTime() + cooldownHours * 60 * 60 * 1000;
  return Date.now() < expires;
}

async function shouldSkipCandidate(
  supabase: SupabaseClient,
  ruleKey: string,
  candidate: TaskRuleCandidate,
  cooldownHours: number,
): Promise<boolean> {
  const last = await getLastFiring(supabase, ruleKey, candidate.entityType, candidate.entityId);
  if (!last) return false;
  if (entityChangedSinceFire(candidate.entityUpdatedAt, last.fired_at)) return false;
  return withinCooldown(last.fired_at, cooldownHours);
}

async function insertTask(
  supabase: SupabaseClient,
  row: {
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    category: string;
    due_date?: string | null;
    job_id?: string | null;
    client_id?: string | null;
    invoice_id?: string | null;
    sort_order: number;
  },
): Promise<string> {
  const { data, error } = await supabase.from("tasks").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function recordFiring(
  supabase: SupabaseClient,
  ruleKey: string,
  candidate: TaskRuleCandidate,
  taskId: string,
): Promise<void> {
  const { error } = await supabase.from("task_rule_firings").upsert(
    {
      rule_key: ruleKey,
      entity_type: candidate.entityType,
      entity_id: candidate.entityId,
      task_id: taskId,
      fired_at: new Date().toISOString(),
    },
    { onConflict: "rule_key,entity_type,entity_id" },
  );
  if (error) throw new Error(error.message);
}

async function createTasksForCandidate(
  supabase: SupabaseClient,
  ruleKey: string,
  rulePriority: string,
  candidate: TaskRuleCandidate,
  sortOrderStart: number,
): Promise<{ taskId: string; created: number; sortOrderNext: number }> {
  const priority = (candidate.priority ?? rulePriority) as TaskPriority;
  let sortOrder = sortOrderStart;

  if (candidate.bulkItems?.length) {
    const rows = candidate.bulkItems.map((item) => ({
      title: item.title,
      description: candidate.description ?? null,
      status: "todo",
      priority: item.priority,
      due_date: candidate.dueDate ?? null,
      category: item.category,
      job_id: candidate.jobId ?? null,
      client_id: candidate.clientId ?? null,
      invoice_id: candidate.invoiceId ?? null,
      sort_order: sortOrder++,
    }));

    const { data, error } = await supabase.from("tasks").insert(rows).select("id");
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((r) => r.id);
    return { taskId: ids[0] ?? "", created: ids.length, sortOrderNext: sortOrder };
  }

  const taskId = await insertTask(supabase, {
    title: candidate.title,
    description: candidate.description ?? null,
    status: "todo",
    priority,
    category: candidate.category ?? "General",
    due_date: candidate.dueDate ?? null,
    job_id: candidate.jobId ?? null,
    client_id: candidate.clientId ?? null,
    invoice_id: candidate.invoiceId ?? null,
    sort_order: sortOrder,
  });

  return { taskId, created: 1, sortOrderNext: sortOrder + 1 };
}

async function processRule(
  supabase: SupabaseClient,
  ruleKey: TaskRuleKey,
  rule: TaskRuleRow | undefined,
  sortOrderStart: number,
): Promise<{ created: number; skipped: number; errors: string[]; sortOrderNext: number }> {
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;
  let sortOrder = sortOrderStart;

  if (!rule?.enabled) {
    return { created, skipped: 1, errors, sortOrderNext: sortOrder };
  }

  const evaluate = RULE_EVALUATORS[ruleKey];
  const { candidates, errors: evalErrors } = await evaluate(supabase);
  errors.push(...evalErrors);

  for (const candidate of candidates) {
    try {
      if (await shouldSkipCandidate(supabase, ruleKey, candidate, rule.cooldown_hours)) {
        skipped += 1;
        continue;
      }

      const result = await createTasksForCandidate(supabase, ruleKey, rule.priority, candidate, sortOrder);
      sortOrder = result.sortOrderNext;
      created += result.created;

      if (result.taskId) {
        await recordFiring(supabase, ruleKey, candidate, result.taskId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${ruleKey}/${candidate.entityId}: ${message}`);
    }
  }

  return { created, skipped, errors, sortOrderNext: sortOrder };
}

export async function runTaskEngine(options?: { rules?: TaskRuleKey[] }): Promise<EngineResult> {
  const jobKey = "ops-task-engine";
  const supabase = createServiceClient();
  const ruleKeys = options?.rules ?? [...TASK_RULE_KEYS];

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const details: Record<string, { created: number; skipped: number }> = {};

  try {
    const rules = await loadTaskRules(supabase);
    let sortOrder = await nextSortOrder(supabase);

    for (const ruleKey of ruleKeys) {
      const result = await processRule(supabase, ruleKey, rules.get(ruleKey), sortOrder);
      created += result.created;
      skipped += result.skipped;
      errors.push(...result.errors);
      sortOrder = result.sortOrderNext;
      details[ruleKey] = { created: result.created, skipped: result.skipped };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(message);
  }

  return {
    ok: errors.length === 0,
    jobKey,
    created,
    updated: 0,
    skipped,
    errors,
    details,
  };
}

export async function spawnRecurringTasks(): Promise<Pick<EngineResult, "created" | "skipped" | "errors">> {
  const supabase = createServiceClient();
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  const { data: parents, error } = await supabase
    .from("tasks")
    .select("*")
    .not("recurring_rule", "is", null)
    .eq("archived", false)
    .eq("status", "done");

  if (error) {
    return { created: 0, skipped: 0, errors: [error.message] };
  }
  if (!parents?.length) {
    return { created: 0, skipped: 0, errors };
  }

  const today = new Date();
  let sortOrder = await nextSortOrder(supabase);

  for (const parent of parents) {
    try {
      const due = parent.due_date ? new Date(parent.due_date) : today;
      const nextDue = new Date(due);
      if (parent.recurring_rule === "daily") nextDue.setDate(nextDue.getDate() + 1);
      if (parent.recurring_rule === "weekly") nextDue.setDate(nextDue.getDate() + 7);
      if (parent.recurring_rule === "monthly") nextDue.setMonth(nextDue.getMonth() + 1);

      const dueIso = nextDue.toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from("tasks")
        .select("id")
        .eq("recurring_parent_id", parent.id)
        .eq("due_date", dueIso)
        .maybeSingle();

      if (existing) {
        skipped += 1;
        continue;
      }

      const { error: insertErr } = await supabase.from("tasks").insert({
        title: parent.title,
        description: parent.description,
        priority: parent.priority,
        category: parent.category,
        due_date: dueIso,
        job_id: parent.job_id,
        client_id: parent.client_id,
        invoice_id: parent.invoice_id,
        expense_id: parent.expense_id,
        assigned_crew_ids: parent.assigned_crew_ids,
        assigned_crew_member_id: parent.assigned_crew_member_id,
        recurring_parent_id: parent.id,
        recurring_rule: parent.recurring_rule,
        status: "todo",
        sort_order: sortOrder++,
      });

      if (insertErr) throw new Error(insertErr.message);
      created += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${parent.id}: ${message}`);
    }
  }

  return { created, skipped, errors };
}

export async function runDailyOps(): Promise<EngineResult> {
  const recurring = await spawnRecurringTasks();
  const engine = await runTaskEngine();

  let receptionistUpdated = 0;
  const receptionistErrors: string[] = [];
  try {
    const { runReceptionistEngine } = await import("@/lib/autopilot/engines/receptionist-engine");
    const receptionist = await runReceptionistEngine();
    receptionistUpdated = receptionist.updated;
    if (!receptionist.ok) receptionistErrors.push(...receptionist.errors);
  } catch (error) {
    receptionistErrors.push(error instanceof Error ? error.message : String(error));
  }

  return {
    ok: engine.ok && recurring.errors.length === 0 && receptionistErrors.length === 0,
    jobKey: "ops-daily",
    created: engine.created + recurring.created,
    updated: engine.updated + receptionistUpdated,
    skipped: engine.skipped + recurring.skipped,
    errors: [...engine.errors, ...recurring.errors, ...receptionistErrors],
    details: {
      ...(engine.details ?? {}),
      recurring: { created: recurring.created, skipped: recurring.skipped },
      receptionist: { updated: receptionistUpdated },
    },
  };
}
