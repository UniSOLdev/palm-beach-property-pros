import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { formatDate } from "@/lib/admin/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").eq("archived", false).order("name");
  return (
    <div className="space-y-4">
      <AdminPageHeader title="Clients" subtitle="CRM — homeowners, managers, hosts" />
      <ul className="space-y-3">
        {!data?.length ? <EmptyState>No clients yet.</EmptyState> : data.map((c) => (
          <li key={c.id} className="admin-card">
            <p className="font-semibold text-navy">{c.name}</p>
            <p className="text-xs text-charcoal/60">{c.client_type} · {c.phone ?? "—"} · {formatDate(c.created_at)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
