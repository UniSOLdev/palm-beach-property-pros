import type { JobDetailPayload } from "@/lib/db-types";
import { mapJobDetailPayload } from "@/lib/job-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

export const JOB_DETAIL_SELECT = `
  *,
  clients ( id, full_name, phone, email ),
  quotes ( id, reference_code, status, client_id ),
  invoices ( id, public_token, title, status, client_id )
`;

export async function fetchJobDetailForAdmin(id: string): Promise<JobDetailPayload | null> {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("jobs")
      .select(JOB_DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapJobDetailPayload(data as Record<string, unknown>);
  } catch {
    return null;
  }
}
