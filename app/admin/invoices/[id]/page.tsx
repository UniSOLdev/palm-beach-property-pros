import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityActivityTimeline } from "@/components/admin/entity-activity-timeline";
import { EntityLifecycleMenu } from "@/components/admin/entity-lifecycle-menu";
import { InvoiceTaskActions } from "@/components/admin/invoice-task-actions";
import { PrintButton } from "@/components/admin/print-button";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { InvoiceTemplate } from "@/components/invoice/invoice-template";
import { rowIsArchived, rowIsDeleted } from "@/lib/admin/lifecycle/list-query";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: inv } = await supabase
    .from("invoices")
    .select("*, clients(name, address)")
    .eq("id", id)
    .maybeSingle();
  if (!inv) notFound();

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("sort_order");

  const { data: settings } = await supabase.from("business_settings").select("*").limit(1).maybeSingle();
  const client = inv.clients as { name?: string; address?: string } | null;
  const crew = await listCrewOptions();
  const lifecycleRow = inv as { archived_at?: string | null; archived?: boolean; deleted_at?: string | null };

  return (
    <div className="space-y-4 print:space-y-0">
      <InvoiceTaskActions
        invoiceId={inv.id}
        clientId={inv.client_id}
        jobId={inv.job_id}
        paymentStatus={inv.payment_status}
        crew={crew}
      />
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <PrintButton />
        <Link href={`/i/${inv.public_id}`} target="_blank" className="admin-btn-secondary no-underline">
          Share link
        </Link>
        <EntityLifecycleMenu
          entityType="invoice"
          entityId={inv.id}
          entityLabel={`Invoice ${inv.invoice_number}`}
          isArchived={rowIsArchived(lifecycleRow)}
          isDeleted={rowIsDeleted(lifecycleRow)}
        />
      </div>
      <InvoiceTemplate
        invoiceNumber={inv.invoice_number}
        clientName={client?.name ?? "Client"}
        clientAddress={client?.address}
        dueDate={inv.due_date}
        terms={inv.terms}
        notes={inv.notes}
        discount={Number(inv.discount)}
        depositPaid={Number(inv.deposit_paid)}
        logoUrl={settings?.logo_url}
        businessPhone={settings?.phone}
        businessEmail={settings?.email}
        lines={(items ?? []).map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
        }))}
      />
      <section className="admin-card print:hidden">
        <h2 className="text-sm font-semibold text-navy">Lifecycle activity</h2>
        <div className="mt-3">
          <EntityActivityTimeline entityType="invoice" entityId={inv.id} />
        </div>
      </section>
    </div>
  );
}
