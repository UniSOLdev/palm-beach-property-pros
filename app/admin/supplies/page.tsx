import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Supplies" };

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from("supplies").select("*").eq("archived", false).order("name");
  return (
    <div className="space-y-4">
      <AdminPageHeader title="Supplies" subtitle="Operational supplies" />
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
