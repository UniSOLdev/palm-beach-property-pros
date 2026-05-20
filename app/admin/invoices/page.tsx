
import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices" };

export default async function AdminInvoicesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, clients(name)")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Invoices" subtitle="Drafts, sent, payments" actionHref="/admin/invoices/new" actionLabel="New invoice" />
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
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <Link href={`/admin/invoices/${inv.id}`} className="font-semibold text-ocean no-underline">Edit / PDF</Link>
                  <Link href={`/i/${inv.public_id}`} className="font-semibold text-ocean no-underline" target="_blank">Share link</Link>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
