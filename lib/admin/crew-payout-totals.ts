import { createClient } from "@/lib/supabase/server";

/** Sum crew payout totals per job for list/dashboard costing. */
export async function getCrewPayoutTotalsByJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("crew_payouts").select("job_id, calculated_total");
  if (error) return {};
  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!row.job_id) continue;
    map[row.job_id] = (map[row.job_id] ?? 0) + Number(row.calculated_total);
  }
  return map;
}
