import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteBuilder } from "@/components/admin/quote-builder";
import { AdminPageHeader } from "@/components/admin/ui";
import { getClientById, getQuoteById } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) notFound();
  const client = await getClientById(quote.clientId);
  const dataMode = isSupabaseServerConfigured() ? "supabase" : "seed";

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
      <QuoteBuilder initialQuote={quote} clientName={client?.name ?? "Client"} mode="existing" dataMode={dataMode} />
    </div>
  );
}
