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
      <AdminPageHeader title="Crew" subtitle="Field crew — used for task assignment" />
      <ul className="space-y-3">
        {!query.data?.length ? (
          <EmptyState>No crew members yet. Add rows in Supabase `crew_members`.</EmptyState>
        ) : (
          query.data.map((row) => (
            <li key={row.id} className="admin-card">
              <p className="font-semibold text-navy">{row.name}</p>
              <p className="text-xs text-charcoal/60">
                {[row.role, row.phone].filter(Boolean).join(" · ") || "—"}
              </p>
              {row.default_pay_rate != null && Number(row.default_pay_rate) > 0 ? (
                <p className="mt-1 text-xs text-charcoal/50">
                  ${Number(row.default_pay_rate).toFixed(2)}/{row.pay_rate_unit ?? "hour"}
                </p>
              ) : null}
              {row.notes ? <p className="mt-2 text-xs text-charcoal/70">{row.notes}</p> : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
