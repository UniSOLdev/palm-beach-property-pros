import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceBuilder } from "@/components/admin/invoice-builder";
import { AdminPageHeader } from "@/components/admin/ui";
import { getClientById, getInvoiceById } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();
  const client = await getClientById(invoice.clientId);
  const dataMode = isSupabaseServerConfigured() ? "supabase" : "seed";

  return (
    <div>
      <AdminPageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle="Track payments, balances, and review follow-ups."
        actions={
          <Link href="/admin/invoices" className="btn-secondary no-underline">
            All invoices
          </Link>
        }
      />
      <InvoiceBuilder initialInvoice={invoice} clientName={client?.name ?? "Client"} mode="existing" dataMode={dataMode} />
    </div>
  );
}
