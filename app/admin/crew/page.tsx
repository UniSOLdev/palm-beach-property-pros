import { CrewPageClient } from "@/components/admin/crew-page-client";
import { listCrewMembers, listCrewPayouts, listJobs } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function CrewPage() {
  const [jobs, crew, payouts] = await Promise.all([listJobs(), listCrewMembers(), listCrewPayouts()]);
  const dataMode = isSupabaseServerConfigured() ? "supabase" : "seed";

  return <CrewPageClient initialJobs={jobs} initialCrew={crew} initialPayouts={payouts} dataMode={dataMode} />;
}
