import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/ui";
import { InvoiceBuilder } from "@/components/admin/invoice-builder";
import { invoiceFromQuote, makeBlankInvoice } from "@/lib/admin/invoice-factory";
import { adminSeed, getQuoteById } from "@/lib/admin/seed";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ fromQuote?: string }>;
}) {
  const sp = await searchParams;
  const fromQuoteId = sp.fromQuote ? decodeURIComponent(sp.fromQuote) : undefined;
  const quote = fromQuoteId ? getQuoteById(fromQuoteId) : undefined;
  const initial = quote ? invoiceFromQuote(quote, null) : makeBlankInvoice(adminSeed.clients[0].id);
  const client = adminSeed.clients.find((c) => c.id === initial.clientId);

  return (
    <div>
      <AdminPageHeader
        title="New invoice"
        subtitle={quote ? `Prefilled from ${quote.quoteNumber}` : "Create from scratch or convert from a quote."}
        actions={
          <Link href="/admin/invoices" className="btn-secondary no-underline">
            Back
          </Link>
        }
      />
      <InvoiceBuilder initialInvoice={initial} clientName={client?.name ?? "Client"} mode="new" />
    </div>
  );
}
