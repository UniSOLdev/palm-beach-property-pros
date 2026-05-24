import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import {
  QUOTE_APPROVAL_LABELS,
  quoteApprovalClass,
  type QuoteApprovalStatus,
} from "@/lib/quotes/constants";
import { calculateQuoteTotals } from "@/lib/quotes/quote-totals";
import type { PublicQuote, PublicQuoteItem } from "@/lib/quotes/types";
import { QuoteESignSection, QuoteViewTracker } from "@/components/quote/quote-esign-section";

type Props = {
  publicId: string;
  quote: PublicQuote;
  items: PublicQuoteItem[];
  signaturePreviewUrl: string | null;
  pdfDownloadUrl: string | null;
};

function formatItemAmount(amount: number) {
  return amount > 0 ? formatCurrency(amount) : "TBD";
}

export function QuotePublicPage({
  publicId,
  quote,
  items,
  signaturePreviewUrl,
  pdfDownloadUrl,
}: Props) {
  const client = quote.clients;
  const approval = quote.approval_status as QuoteApprovalStatus;
  const { lineItems, subtotal, tax, total } = calculateQuoteTotals(items);

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream via-cream to-sky/20 px-4 py-8 pb-safe">
      <QuoteViewTracker publicId={publicId} />
      <div className="mx-auto max-w-lg space-y-5">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ocean">Palm Beach Property Pros</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy">Your Estimate</h1>
          <p className="mt-1 text-sm text-charcoal/60">{quote.quote_number}</p>
          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${quoteApprovalClass(approval)}`}
          >
            {QUOTE_APPROVAL_LABELS[approval] ?? approval}
          </span>
        </header>

        <section className="rounded-2xl border border-navy/10 bg-white/90 p-5 shadow-md backdrop-blur-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-charcoal/50">Prepared for</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {client?.name ? (
              <div className="flex justify-between gap-3">
                <dt className="text-charcoal/60">Client</dt>
                <dd className="font-medium text-navy text-right">{client.name}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-charcoal/60">Service</dt>
              <dd className="font-medium text-navy text-right">{quote.service_type}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-charcoal/60">Property</dt>
              <dd className="font-medium text-navy text-right">{quote.job_address}</dd>
            </div>
            {quote.expiration_date ? (
              <div className="flex justify-between gap-3">
                <dt className="text-charcoal/60">Valid through</dt>
                <dd className="text-navy">{formatDate(quote.expiration_date)}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-md">
          <div className="border-b border-navy/5 bg-navy/5 px-5 py-3">
            <h2 className="text-sm font-bold text-navy">Scope & pricing</h2>
          </div>
          <ul className="divide-y divide-navy/5 px-5 py-2">
            {lineItems.length ? (
              lineItems.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <span className="text-charcoal/90">{item.description}</span>
                    {item.quantity > 1 ? (
                      <span className="mt-0.5 block text-xs text-charcoal/50">
                        {item.quantity} × {formatItemAmount(item.unitPrice)}
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-semibold text-navy">{formatItemAmount(item.lineTotal)}</span>
                </li>
              ))
            ) : (
              <li className="py-4 text-sm text-charcoal/70">
                Your estimator will finalize line items — contact us if you have questions about pricing.
              </li>
            )}
          </ul>
          <div className="space-y-2 border-t border-navy/10 bg-gradient-to-r from-navy/5 to-ocean/5 px-5 py-4 text-sm">
            <div className="flex justify-between text-charcoal/80">
              <span>Subtotal</span>
              <span>{subtotal > 0 ? formatCurrency(subtotal) : "TBD"}</span>
            </div>
            {tax > 0 ? (
              <div className="flex justify-between text-charcoal/80">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            ) : null}
            <div className="flex justify-between pt-1 text-lg font-bold text-navy">
              <span>Total</span>
              <span>{total > 0 ? formatCurrency(total) : "TBD"}</span>
            </div>
          </div>
          {quote.deposit_required && quote.deposit_amount ? (
            <p className="border-t border-navy/5 px-5 py-3 text-xs text-charcoal/60">
              Deposit due upon scheduling: {formatCurrency(Number(quote.deposit_amount))}
            </p>
          ) : null}
        </section>

        {quote.notes ? (
          <section className="rounded-2xl border border-navy/10 bg-white/90 p-5 text-sm leading-relaxed text-charcoal/85 shadow-sm whitespace-pre-wrap">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-charcoal/50">Scope notes</h2>
            {quote.notes}
          </section>
        ) : null}

        {quote.terms ? (
          <section className="rounded-2xl border border-navy/10 bg-white/80 p-5 text-sm leading-relaxed text-charcoal/75 shadow-sm whitespace-pre-wrap">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-charcoal/50">Terms</h2>
            {quote.terms}
          </section>
        ) : null}

        <QuoteESignSection
          publicId={publicId}
          approvalStatus={approval}
          signedName={quote.signed_name}
          signedAt={quote.signed_at}
          clientName={client?.name ?? null}
          total={total}
          signaturePreviewUrl={signaturePreviewUrl}
          pdfDownloadUrl={pdfDownloadUrl}
        />

        <p className="text-center text-xs text-charcoal/50">
          Questions?{" "}
          <Link href="/quote" className="font-semibold text-ocean no-underline hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </main>
  );
}
