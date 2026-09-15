import Link from "next/link";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { EntityLifecycleMenu } from "@/components/admin/entity-lifecycle-menu";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { fromSupabase } from "@/lib/admin/db-query";
import { formatDate } from "@/lib/admin/format";
import { applyLifecycleFilters, rowIsArchived, rowIsDeleted } from "@/lib/admin/lifecycle/list-query";
import { lifecycleOptionsFromSearchParams } from "@/lib/admin/lifecycle/search-params";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients" };

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const lifecycle = lifecycleOptionsFromSearchParams({ archived });
  let crew: Awaited<ReturnType<typeof listCrewOptions>> = [];
  try {
    crew = await listCrewOptions();
  } catch {
    /* non-blocking */
  }

  const supabase = await createClient();
  let listQuery = supabase.from("clients").select("*").order("name");
  listQuery = applyLifecycleFilters(listQuery, lifecycle);
  const { data, error } = await listQuery;
  const result = fromSupabase(data, error, { route: "/admin/clients", query: "clients list" });

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Clients" subtitle="CRM — homeowners, managers, hosts" />
        <LoadError title="Could not load clients" message={result.error} retryHref="/admin/clients" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Clients" subtitle="CRM — homeowners, managers, hosts" actionHref="/admin/tasks" actionLabel="All tasks" />
      <AdminListToolbar />
      <TaskQuickAdd crew={crew} variant="primary" label="+ Add client task" className="w-full" defaults={{ category: "Client Communication" }} />
      <ul className="space-y-3">
        {!result.data?.length ? (
          <EmptyState>No clients yet.</EmptyState>
        ) : (
          result.data.map((c) => (
            <li key={c.id} className="admin-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy">{c.name}</p>
                  <p className="text-xs text-charcoal/60">
                    {c.client_type} · {c.phone ?? "—"} · {formatDate(c.created_at)}
                  </p>
                </div>
                <EntityLifecycleMenu
                  entityType="client"
                  entityId={c.id}
                  entityLabel={c.name}
                  isArchived={rowIsArchived(c as { archived_at?: string | null; archived?: boolean })}
                  isDeleted={rowIsDeleted(c as { deleted_at?: string | null })}
                />
              </div>
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
