import type { SupabaseClient } from "@supabase/supabase-js";

import type { JobMatchRow } from "@/lib/expense-import";

export async function loadJobsForExpenseMatching(supabase: SupabaseClient): Promise<JobMatchRow[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      job_number,
      clients ( full_name )
    `,
    )
    .order("updated_at", { ascending: false })
    .limit(800);

  if (error) throw error;

  return (data ?? []).map((raw) => {
    const j = raw as Record<string, unknown>;
    const c = j.clients;
    const client_name = Array.isArray(c)
      ? (c[0] as { full_name?: string })?.full_name
      : (c as { full_name?: string } | null)?.full_name;
    return {
      id: String(j.id),
      title: j.title != null ? String(j.title) : null,
      job_number: j.job_number != null ? String(j.job_number) : null,
      client_name: client_name ? String(client_name) : null,
    };
  });
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
