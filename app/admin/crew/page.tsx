import { CrewManager } from "@/components/admin/crew-manager";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { createClient } from "@/lib/supabase/server";
import { listCrewMembers } from "@/lib/supabase/queries/crew";

export const dynamic = "force-dynamic";
export const metadata = { title: "Crew" };

export default async function Page() {
  const supabase = await createClient();
  const query = await listCrewMembers(supabase);

  if (!query.ok) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Crew" subtitle="Field crew — used for task assignment" />
        <LoadError title="Could not load crew" message={query.error} retryHref="/admin/crew" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Crew"
        subtitle="Roster, pay rates, referral bonuses — powers Employee Hub assignment"
      />
      {!query.data?.length ? (
        <EmptyState>No crew members yet — add your first below.</EmptyState>
      ) : null}
      <CrewManager initial={query.data ?? []} />
    </div>
  );
}
