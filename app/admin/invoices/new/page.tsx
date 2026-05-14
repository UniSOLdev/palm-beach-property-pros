import Link from "next/link";
import { InvoiceBuilder } from "@/components/admin/invoice-builder";
import { AdminPageHeader } from "@/components/admin/ui";
import { invoiceFromQuote, makeBlankInvoice } from "@/lib/admin/invoice-factory";
import { getClientById, getQuoteById, listClients } from "@/lib/admin/queries";
import { adminSeed } from "@/lib/admin/seed";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ fromQuote?: string }>;
}) {
  const sp = await searchParams;
  const fromQuoteId = sp.fromQuote ? decodeURIComponent(sp.fromQuote) : undefined;
  const quote = fromQuoteId ? await getQuoteById(fromQuoteId) : undefined;
  const clients = await listClients();
  const fallbackClientId = clients[0]?.id ?? adminSeed.clients[0].id;
  const initial = quote ? invoiceFromQuote(quote, null) : makeBlankInvoice(fallbackClientId);
  const client = (await getClientById(initial.clientId)) ?? clients.find((c) => c.id === initial.clientId);
  const dataMode = isSupabaseServerConfigured() ? "supabase" : "seed";

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
      <InvoiceBuilder initialInvoice={initial} clientName={client?.name ?? "Client"} mode="new" dataMode={dataMode} />
    </div>
  );
}
