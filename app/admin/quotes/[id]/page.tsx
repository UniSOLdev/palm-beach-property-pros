import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { QuoteBookingToolbar } from "@/components/admin/quote-booking-toolbar";
import { QuoteBuilder } from "@/components/admin/quote-builder";
import { AdminPageHeader } from "@/components/admin/ui";
import { buildDepositInstructionText, resolveBookingHref } from "@/lib/booking-settings";
import { getBusinessSettings, getClientById, getQuoteById } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) notFound();
  const [client, settings, hdrs] = await Promise.all([getClientById(quote.clientId), getBusinessSettings(), headers()]);
  const dataMode = isSupabaseServerConfigured() ? "supabase" : "seed";

  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const siteOrigin = host ? `${proto}://${host}` : "";

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
      {dataMode === "supabase" ? (
        <QuoteBookingToolbar
          quoteId={quote.id}
          quotePublicId={quote.publicId}
          siteOrigin={siteOrigin}
          bookingHref={resolveBookingHref(settings)}
          squareBookingUrl={settings.squareBookingUrl ?? ""}
          depositInstructions={buildDepositInstructionText(settings)}
          depositReceived={Boolean(quote.depositReceived)}
        />
      ) : null}
      <QuoteBuilder initialQuote={quote} clientName={client?.name ?? "Client"} mode="existing" dataMode={dataMode} />
    </div>
  );
}
