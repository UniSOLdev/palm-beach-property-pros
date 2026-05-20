import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { InvoiceTemplate } from "@/components/invoice/invoice-template";
import { duplicateInvoiceAction } from "@/lib/admin/actions/invoices";
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

  return (
    <div className="space-y-4 print:space-y-0">
      <div className="flex flex-wrap gap-2 print:hidden">
        <PrintButton />
        <Link href={`/i/${inv.public_id}`} target="_blank" className="admin-btn-secondary no-underline">
          Share link
        </Link>
        <form action={duplicateInvoiceAction.bind(null, id)}>
          <button type="submit" className="admin-btn-secondary">
            Duplicate
          </button>
        </form>
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
    </div>
  );
}
