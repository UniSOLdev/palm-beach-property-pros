
import Link from "next/link";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { EntityLifecycleMenu } from "@/components/admin/entity-lifecycle-menu";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { fromSupabase } from "@/lib/admin/db-query";
import { formatDate } from "@/lib/admin/format";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { applyLifecycleFilters, rowIsArchived, rowIsDeleted } from "@/lib/admin/lifecycle/list-query";
import { lifecycleOptionsFromSearchParams } from "@/lib/admin/lifecycle/search-params";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices" };

type Props = { searchParams: Promise<{ archived?: string }> };

export default async function AdminInvoicesPage({ searchParams }: Props) {
  const { archived } = await searchParams;
  const lifecycle = lifecycleOptionsFromSearchParams({ archived });

  let crew: Awaited<ReturnType<typeof listCrewOptions>> = [];
  try {
    crew = await listCrewOptions();
  } catch {
    /* non-blocking */
  }

  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });
  query = applyLifecycleFilters(query, lifecycle);

  const { data, error } = await query;

  const result = fromSupabase(data, error, { route: "/admin/invoices", query: "invoices with clients" });

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Invoices" subtitle="Drafts, sent, payments" />
        <LoadError title="Could not load invoices" message={result.error} retryHref="/admin/invoices" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Invoices" subtitle="Drafts, sent, payments" actionHref="/admin/invoices/new" actionLabel="New invoice" />
      <AdminListToolbar />
      <TaskQuickAdd crew={crew} variant="secondary" label="+ Add invoice task" className="w-full" defaults={{ category: "Invoice Follow-Up" }} />
      <ul className="space-y-3">
        {!result.data?.length ? (
          <EmptyState>{lifecycle.showArchived ? "No archived invoices." : "No invoices yet."}</EmptyState>
        ) : (
          result.data.map((inv) => {
            const client = inv.clients as { name?: string } | null;
            const archived = rowIsArchived(inv as { archived_at?: string | null; archived?: boolean });
            const deleted = rowIsDeleted(inv as { deleted_at?: string | null });
            return (
              <li key={inv.id} className="admin-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">#{inv.invoice_number}</p>
                    <p className="text-xs text-charcoal/60">{client?.name ?? "Client"} · {formatDate(inv.created_at)}</p>
                    {archived ? <span className="admin-chip mt-1 bg-charcoal/10 text-charcoal">Archived</span> : null}
                    {deleted ? <span className="admin-chip mt-1 bg-red-100 text-red-800">In trash</span> : null}
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <span className="admin-chip bg-sky/50 text-navy">{inv.payment_status}</span>
                    <EntityLifecycleMenu
                      entityType="invoice"
                      entityId={inv.id}
                      entityLabel={`Invoice ${inv.invoice_number}`}
                      isArchived={archived}
                      isDeleted={deleted}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <Link href={`/admin/invoices/${inv.id}`} className="font-semibold text-ocean no-underline">Edit / PDF</Link>
                  <Link href={`/i/${inv.public_id}`} className="font-semibold text-ocean no-underline" target="_blank">Share link</Link>
                  <TaskQuickAdd
                    crew={crew}
                    variant="compact"
                    label="+ Task"
                    defaults={{
                      invoice_id: inv.id,
                      client_id: inv.client_id,
                      job_id: inv.job_id ?? undefined,
                      category: "Invoice Follow-Up",
                      title: inv.payment_status !== "Paid" ? "Follow up on unpaid invoice" : undefined,
                    }}
                  />
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
