"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { JOB_CHECKLIST_ITEMS } from "@/lib/admin/task-constants";
import type { CreateTaskInput, TaskBulkDefaults, TaskRow } from "@/lib/admin/types";

function revalidateTaskPaths(jobId?: string | null, invoiceId?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/tasks");
  if (jobId) revalidatePath(`/admin/jobs/${jobId}`);
  if (invoiceId) revalidatePath(`/admin/invoices/${invoiceId}`);
}

async function nextSortOrder(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("tasks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

export async function listTasks(): Promise<TaskRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as TaskRow[];
}

export async function listTasksForJob(jobId: string): Promise<TaskRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("job_id", jobId)
    .eq("archived", false)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as TaskRow[];
}

export async function listCrewOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crew_members")
    .select("id, name")
    .eq("archived", false)
    .order("name");
  return data ?? [];
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const crewIds = input.assigned_crew_ids ?? [];
  if (input.assigned_crew_member_id && !crewIds.includes(input.assigned_crew_member_id)) {
    crewIds.push(input.assigned_crew_member_id);
  }

  const { error } = await supabase.from("tasks").insert({
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "todo",
    priority: input.priority ?? "medium",
    due_date: input.due_date ?? null,
    category: input.category ?? "General",
    job_id: input.job_id ?? null,
    client_id: input.client_id ?? null,
    invoice_id: input.invoice_id ?? null,
    expense_id: input.expense_id ?? null,
    assigned_crew_member_id: input.assigned_crew_member_id ?? null,
    assigned_crew_ids: crewIds,
    recurring_rule: input.recurring_rule ?? null,
    sort_order: await nextSortOrder(supabase),
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidateTaskPaths(input.job_id, input.invoice_id);
}

export async function createTasksBulk(
  items: { title: string; category?: string; priority?: string; due_date?: string | null }[],
  defaults: TaskBulkDefaults,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let order = await nextSortOrder(supabase);

  const rows = items.map((item) => ({
    title: item.title,
    description: defaults.description ?? null,
    status: defaults.status ?? "todo",
    priority: item.priority ?? defaults.priority ?? "medium",
    due_date: item.due_date ?? defaults.due_date ?? null,
    category: item.category ?? defaults.category ?? "General",
    job_id: defaults.job_id ?? null,
    client_id: defaults.client_id ?? null,
    invoice_id: defaults.invoice_id ?? null,
    expense_id: defaults.expense_id ?? null,
    assigned_crew_member_id: defaults.assigned_crew_member_id ?? null,
    assigned_crew_ids: defaults.assigned_crew_ids ?? [],
    recurring_rule: null,
    sort_order: order++,
    created_by: user?.id ?? null,
  }));

  const { error } = await supabase.from("tasks").insert(rows);
  if (error) throw new Error(error.message);
  revalidateTaskPaths(defaults.job_id, defaults.invoice_id);
}

export async function createJobChecklist(jobId: string, clientId?: string | null) {
  await createTasksBulk(
    JOB_CHECKLIST_ITEMS.map((i) => ({
      title: i.title,
      category: i.category,
      priority: i.priority,
    })),
    { job_id: jobId, client_id: clientId ?? null, category: "Job Follow-Up" },
  );
}

export async function updateTask(
  id: string,
  patch: Partial<
    Pick<
      TaskRow,
      | "title"
      | "description"
      | "status"
      | "priority"
      | "due_date"
      | "category"
      | "sort_order"
      | "job_id"
      | "client_id"
      | "invoice_id"
      | "expense_id"
      | "assigned_crew_member_id"
    >
  >,
) {
  const supabase = await createClient();
  const payload: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };

  if (patch.status === "done" || patch.status === "completed") {
    payload.status = "done";
    payload.completed_at = new Date().toISOString();
  } else if (patch.status) {
    payload.completed_at = null;
  }

  const { data: existing } = await supabase.from("tasks").select("job_id").eq("id", id).single();
  const { error } = await supabase.from("tasks").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTaskPaths(existing?.job_id ?? patch.job_id);
}

export async function archiveTask(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("tasks").select("job_id").eq("id", id).single();
  const { error } = await supabase
    .from("tasks")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTaskPaths(existing?.job_id);
}

export async function reorderTasks(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("tasks").update({ sort_order: index, updated_at: new Date().toISOString() }).eq("id", id),
    ),
  );
  revalidatePath("/admin/tasks");
}

export async function moveTask(id: string, direction: "up" | "down", visibleIds: string[]) {
  const idx = visibleIds.indexOf(id);
  if (idx < 0) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= visibleIds.length) return;
  const next = [...visibleIds];
  [next[idx], next[swap]] = [next[swap], next[idx]];
  await reorderTasks(next);
}

export async function quickCompleteTask(id: string) {
  await updateTask(id, { status: "done" });
}

export async function spawnRecurringTasks() {
  const supabase = await createClient();
  const { data: parents } = await supabase
    .from("tasks")
    .select("*")
    .not("recurring_rule", "is", null)
    .eq("archived", false)
    .eq("status", "done");

  if (!parents?.length) return;

  const today = new Date();
  for (const parent of parents) {
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

    if (existing) continue;

    await supabase.from("tasks").insert({
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
      sort_order: await nextSortOrder(supabase),
    });
  }
  revalidatePath("/admin/tasks");
}
