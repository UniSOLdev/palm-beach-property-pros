import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { InvoiceBuilder } from "@/components/admin/invoice-builder";
import { getClientById, getInvoiceById } from "@/lib/admin/seed";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = getInvoiceById(id);
  if (!invoice) notFound();
  const client = getClientById(invoice.clientId);

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
      <InvoiceBuilder initialInvoice={invoice} clientName={client?.name ?? "Client"} mode="existing" />
    </div>
  );
}
