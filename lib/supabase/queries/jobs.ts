import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { toQueryResult } from "@/lib/supabase/queries/client";
import { JOB_WITH_CLIENT } from "@/lib/supabase/queries/selectors";

type Db = SupabaseClient<Database>;

export async function listJobs(supabase: Db, options?: { archived?: boolean }) {
  let query = supabase.from("jobs").select(JOB_WITH_CLIENT).order("job_date", { ascending: false });
  if (options?.archived !== true) query = query.eq("archived", false);
  const { data, error } = await query;
  return toQueryResult(data ?? [], error, { route: "/admin/jobs", query: "jobs list" });
}

export async function getJobById(supabase: Db, id: string) {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  return toQueryResult(data, error, { route: "/admin/jobs", query: "job by id" });
}
