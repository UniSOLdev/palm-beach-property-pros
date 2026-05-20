"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskRow } from "@/lib/admin/types";

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

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: TaskRow["priority"];
  due_date?: string | null;
  assigned_crew_ids?: string[];
  recurring_rule?: TaskRow["recurring_rule"];
}) {
  const supabase = await createClient();
  const { data: maxOrder } = await supabase
    .from("tasks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("tasks").insert({
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? "normal",
    due_date: input.due_date ?? null,
    assigned_crew_ids: input.assigned_crew_ids ?? [],
    recurring_rule: input.recurring_rule ?? null,
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/tasks");
}

export async function updateTask(
  id: string,
  patch: Partial<
    Pick<TaskRow, "title" | "description" | "status" | "priority" | "due_date" | "sort_order">
  >,
) {
  const supabase = await createClient();
  const payload: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  if (patch.status === "completed") payload.completed_at = new Date().toISOString();
  if (patch.status && patch.status !== "completed") payload.completed_at = null;

  const { error } = await supabase.from("tasks").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/tasks");
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

export async function quickCompleteTask(id: string) {
  await updateTask(id, { status: "completed" });
}

export async function spawnRecurringTasks() {
  const supabase = await createClient();
  const { data: parents } = await supabase
    .from("tasks")
    .select("*")
    .not("recurring_rule", "is", null)
    .eq("archived", false)
    .eq("status", "completed");

  if (!parents?.length) return;

  const today = new Date();
  for (const parent of parents) {
    const due = parent.due_date ? new Date(parent.due_date) : today;
    let nextDue = new Date(due);
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
      due_date: dueIso,
      assigned_crew_ids: parent.assigned_crew_ids,
      recurring_parent_id: parent.id,
      recurring_rule: parent.recurring_rule,
      status: "open",
    });

    await supabase.from("tasks").update({ status: "open" }).eq("id", parent.id);
  }
  revalidatePath("/admin/tasks");
}
