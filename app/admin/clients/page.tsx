import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { formatDate } from "@/lib/admin/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  const crew = await listCrewOptions();
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").eq("archived", false).order("name");
  return (
    <div className="space-y-4">
      <AdminPageHeader title="Clients" subtitle="CRM — homeowners, managers, hosts" actionHref="/admin/tasks" actionLabel="All tasks" />
      <TaskQuickAdd crew={crew} variant="primary" label="+ Add client task" className="w-full" defaults={{ category: "Client Communication" }} />
      <ul className="space-y-3">
        {!data?.length ? (
          <EmptyState>No clients yet.</EmptyState>
        ) : (
          data.map((c) => (
            <li key={c.id} className="admin-card">
              <p className="font-semibold text-navy">{c.name}</p>
              <p className="text-xs text-charcoal/60">
                {c.client_type} · {c.phone ?? "—"} · {formatDate(c.created_at)}
              </p>
              <div className="mt-3">
                <TaskQuickAdd
                  crew={crew}
                  variant="compact"
                  label="+ Task"
                  defaults={{ client_id: c.id, category: "Client Communication" }}
                />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
