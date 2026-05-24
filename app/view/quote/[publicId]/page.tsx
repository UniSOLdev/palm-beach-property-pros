import { notFound } from "next/navigation";
import Link from "next/link";
import { QuotePublicPage } from "@/components/quote/quote-public-page";
import { mapPublicQuote } from "@/lib/quotes/map-public-quote";
import { getPublicQuoteDocumentUrls } from "@/lib/quotes/public-signed-urls";
import type { PublicQuoteItem } from "@/lib/quotes/types";
import { fetchPublicQuote } from "@/lib/supabase/public-share";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quote · Palm Beach Property Pros",
  robots: { index: false, follow: false },
};

export default async function ViewQuotePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const result = await fetchPublicQuote(publicId);

  if (!result.ok) {
    if (result.reason === "not_found") notFound();
    return (
      <main className="min-h-screen bg-cream px-4 py-8 pb-safe">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-bold text-navy">Unable to load quote</h1>
          <p className="mt-2 text-sm text-charcoal/80">Please contact Palm Beach Property Pros for assistance.</p>
          <Link href="/quote" className="mt-4 inline-block font-semibold text-ocean no-underline">
            Request a quote
          </Link>
        </div>
      </main>
    );
  }

  const { quote, items } = mapPublicQuote(
    result.quote as Record<string, unknown>,
    (result.items ?? []) as PublicQuoteItem[],
  );

  const { signaturePreviewUrl, pdfDownloadUrl } = await getPublicQuoteDocumentUrls(quote);

  return (
    <QuotePublicPage
      publicId={publicId}
      quote={quote}
      items={items}
      signaturePreviewUrl={signaturePreviewUrl}
      pdfDownloadUrl={pdfDownloadUrl}
    />
  );
}
