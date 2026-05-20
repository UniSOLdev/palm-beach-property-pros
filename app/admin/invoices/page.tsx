
import Link from "next/link";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices" };

export default async function AdminInvoicesPage() {
  const crew = await listCrewOptions();
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, clients(name)")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Invoices" subtitle="Drafts, sent, payments" actionHref="/admin/invoices/new" actionLabel="New invoice" />
      <TaskQuickAdd crew={crew} variant="secondary" label="+ Add invoice task" className="w-full" defaults={{ category: "Invoice Follow-Up" }} />
      <ul className="space-y-3">
        {!data?.length ? (
          <EmptyState>No invoices yet.</EmptyState>
        ) : (
          data.map((inv) => {
            const client = inv.clients as { name?: string } | null;
            return (
              <li key={inv.id} className="admin-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">#{inv.invoice_number}</p>
                    <p className="text-xs text-charcoal/60">{client?.name ?? "Client"} · {formatDate(inv.created_at)}</p>
                  </div>
                  <span className="admin-chip bg-sky/50 text-navy">{inv.payment_status}</span>
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
