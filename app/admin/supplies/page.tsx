import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Supplies" };

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("supplies").select("*").eq("archived", false).order("name");
  return (
    <div className="space-y-4">
      <AdminPageHeader title="Supplies" subtitle="Operational supplies" />
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Could not load supplies: {error.message}</p>
      ) : null}
      <ul className="space-y-3">
        {!data?.length ? <EmptyState>No records yet.</EmptyState> : data.map((row) => (
          <li key={row.id} className="admin-card">
            <p className="font-semibold text-navy">{row.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
