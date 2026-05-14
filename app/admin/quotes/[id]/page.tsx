import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { QuoteBuilder } from "@/components/admin/quote-builder";
import { getClientById, getQuoteById } from "@/lib/admin/seed";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = getQuoteById(id);
  if (!quote) notFound();
  const client = getClientById(quote.clientId);

  return (
    <div>
      <AdminPageHeader
        title={`Quote ${quote.quoteNumber}`}
        subtitle="Line-item builder with print layout and client view."
        actions={
          <Link href="/admin/quotes" className="btn-secondary no-underline">
            All quotes
          </Link>
        }
      />
      <QuoteBuilder initialQuote={quote} clientName={client?.name ?? "Client"} mode="existing" />
    </div>
  );
}
