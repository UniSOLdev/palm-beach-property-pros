import Link from "next/link";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { fromSupabase } from "@/lib/admin/db-query";
import { formatDate } from "@/lib/admin/format";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  let crew: Awaited<ReturnType<typeof listCrewOptions>> = [];
  try {
    crew = await listCrewOptions();
  } catch {
    /* non-blocking */
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("*").eq("archived", false).order("name");
  const query = fromSupabase(data, error, { route: "/admin/clients", query: "clients list" });

  if (!query.ok) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Clients" subtitle="CRM — homeowners, managers, hosts" />
        <LoadError title="Could not load clients" message={query.error} retryHref="/admin/clients" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Clients" subtitle="CRM — homeowners, managers, hosts" actionHref="/admin/tasks" actionLabel="All tasks" />
      <TaskQuickAdd crew={crew} variant="primary" label="+ Add client task" className="w-full" defaults={{ category: "Client Communication" }} />
      <ul className="space-y-3">
        {!query.data?.length ? (
          <EmptyState>No clients yet.</EmptyState>
        ) : (
          query.data.map((c) => (
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
