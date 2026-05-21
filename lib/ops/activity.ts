import type { SupabaseClient } from "@supabase/supabase-js";
import type { OperationalActivityRow } from "@/lib/db-types";

export type ActivityInput = {
  event_type: string;
  title: string;
  body?: string | null;
  actor_name?: string | null;
  job_id?: string | null;
  client_id?: string | null;
  task_id?: string | null;
  invoice_id?: string | null;
  expense_id?: string | null;
  href?: string | null;
  metadata?: Record<string, unknown>;
};

export function mapOperationalActivityRow(data: Record<string, unknown>): OperationalActivityRow {
  return {
    id: String(data.id),
    event_type: String(data.event_type ?? "event"),
    title: String(data.title ?? "Activity"),
    body: data.body != null ? String(data.body) : null,
    actor_name: String(data.actor_name ?? "PBPP Ops"),
    job_id: data.job_id ? String(data.job_id) : null,
    client_id: data.client_id ? String(data.client_id) : null,
    task_id: data.task_id ? String(data.task_id) : null,
    invoice_id: data.invoice_id ? String(data.invoice_id) : null,
    expense_id: data.expense_id ? String(data.expense_id) : null,
    href: data.href != null ? String(data.href) : null,
    metadata: (data.metadata && typeof data.metadata === "object" ? data.metadata : {}) as Record<string, unknown>,
    created_at: String(data.created_at ?? ""),
  };
}

export async function logOperationalActivity(
  supabase: SupabaseClient,
  input: ActivityInput,
): Promise<void> {
  const title = input.title.trim();
  if (!title) return;

  const { error } = await supabase.from("operational_activity").insert({
    event_type: input.event_type.trim() || "event",
    title,
    body: input.body?.trim() || null,
    actor_name: input.actor_name?.trim() || "PBPP Ops",
    job_id: input.job_id || null,
    client_id: input.client_id || null,
    task_id: input.task_id || null,
    invoice_id: input.invoice_id || null,
    expense_id: input.expense_id || null,
    href: input.href || null,
    metadata: input.metadata ?? {},
  });

  // Activity should never break the operational mutation that produced it.
  if (error) return;
}

export async function fetchRecentOperationalActivity(
  supabase: SupabaseClient,
  limit = 20,
): Promise<OperationalActivityRow[]> {
  const { data, error } = await supabase
    .from("operational_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => mapOperationalActivityRow(row as Record<string, unknown>));
}

export async function fetchJobOperationalActivity(
  supabase: SupabaseClient,
  jobId: string,
  limit = 30,
): Promise<OperationalActivityRow[]> {
  const { data, error } = await supabase
    .from("operational_activity")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => mapOperationalActivityRow(row as Record<string, unknown>));
}
