import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchPublicQuote } from "@/lib/supabase/public-share";
import { formatCurrency, formatDate } from "@/lib/admin/format";

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
          <p className="mt-2 text-sm text-charcoal/80">
            This quote link may be invalid or temporarily unavailable. Please contact Palm Beach Property Pros.
          </p>
          <Link href="/quote" className="mt-4 inline-block font-semibold text-ocean no-underline">
            Request a quote
          </Link>
        </div>
      </main>
    );
  }

  const { quote, items } = result;
  const client = quote.clients as { name?: string; email?: string; phone?: string; address?: string } | null;
  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);

  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-safe">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-ocean">Palm Beach Property Pros</p>
          <h1 className="mt-2 text-2xl font-bold text-navy">Quote</h1>
          <p className="text-sm text-charcoal/70">{quote.quote_number}</p>
        </header>

        <section className="rounded-2xl border border-navy/10 bg-white p-4 text-sm space-y-2">
          {client?.name ? <p><span className="text-charcoal/60">Client:</span> {client.name}</p> : null}
          <p><span className="text-charcoal/60">Service:</span> {quote.service_type}</p>
          <p><span className="text-charcoal/60">Address:</span> {quote.job_address}</p>
          {quote.expiration_date ? (
            <p><span className="text-charcoal/60">Valid through:</span> {formatDate(quote.expiration_date)}</p>
          ) : null}
          <p><span className="text-charcoal/60">Status:</span> {quote.status}</p>
        </section>

        <ul className="space-y-2 rounded-2xl border border-navy/10 bg-white p-4">
          {items.length ? (
            items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm border-b border-navy/5 pb-2 last:border-0">
                <span>{item.description}</span>
                <span className="font-semibold text-navy shrink-0">
                  {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                </span>
              </li>
            ))
          ) : (
            <li className="text-sm text-charcoal/70">Pricing pending — your estimator will finalize line items.</li>
          )}
          <li className="flex justify-between pt-2 text-lg font-bold text-navy">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </li>
        </ul>

        {quote.notes ? (
          <section className="rounded-2xl border border-navy/10 bg-white p-4 text-sm text-charcoal/85 whitespace-pre-wrap">
            {quote.notes}
          </section>
        ) : null}

        {quote.terms ? (
          <section className="rounded-2xl border border-navy/10 bg-white p-4 text-sm text-charcoal/85 whitespace-pre-wrap">
            {quote.terms}
          </section>
        ) : null}

        <p className="text-center text-sm text-charcoal/60">
          Questions?{" "}
          <Link href="/quote" className="font-semibold text-ocean no-underline">
            Request a quote
          </Link>
        </p>
      </div>
    </main>
  );
}
