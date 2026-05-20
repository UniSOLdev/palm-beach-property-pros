import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Crew" };

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crew_members")
    .select("id, name, phone, email, role")
    .eq("archived", false)
    .order("name");

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Crew" subtitle="Field crew — used for task assignment" />
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load crew: {error.message}
        </p>
      ) : null}
      <ul className="space-y-3">
        {!data?.length ? (
          <EmptyState>No crew members yet. Add rows in Supabase `crew_members`.</EmptyState>
        ) : (
          data.map((row) => (
            <li key={row.id} className="admin-card">
              <p className="font-semibold text-navy">{row.name}</p>
              <p className="text-xs text-charcoal/60">
                {[row.role, row.phone, row.email].filter(Boolean).join(" · ") || "—"}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
