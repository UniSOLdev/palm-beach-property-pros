import { notFound } from "next/navigation";
import { PrintButton } from "@/components/view/print-button";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { quoteLineTotal, quoteRemaining } from "@/lib/admin/quote-totals";
import { getBusinessSettings, getClientById, getQuoteByPublicId } from "@/lib/admin/queries";

export default async function PublicQuotePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const quote = await getQuoteByPublicId(decodeURIComponent(publicId));
  if (!quote) notFound();
  const client = await getClientById(quote.clientId);
  const brand = await getBusinessSettings();

  const total = quoteLineTotal(quote);
  const remaining = quoteRemaining(quote);

  return (
    <div className="rounded-3xl border border-navy/10 bg-white p-8 shadow-card print:shadow-none">
      <header className="border-b border-navy/10 pb-6">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-ocean">Estimate</div>
        <h1 className="mt-2 text-3xl font-bold text-navy">{brand.businessName}</h1>
        <p className="mt-2 text-sm text-charcoal/70">
          {brand.phone} · {brand.email}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-sky px-3 py-1 font-semibold text-navy">{quote.quoteNumber}</span>
          <span className="rounded-full border border-navy/15 px-3 py-1 font-semibold text-navy">{quote.status}</span>
          <span className="rounded-full border border-navy/15 px-3 py-1 font-semibold text-navy">
            Expires {formatDate(quote.expirationDate)}
          </span>
        </div>
      </header>

      <section className="mt-6 grid gap-4 text-sm md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Prepared for</div>
          <div className="mt-1 text-lg font-semibold text-navy">{client?.name}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Service</div>
          <div className="mt-1 font-semibold text-navy">{quote.serviceType}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Job address</div>
          <div className="mt-1 text-charcoal">{quote.jobAddress}</div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70">Line items</h2>
        <div className="mt-3 divide-y divide-navy/10 rounded-2xl border border-navy/10">
          {quote.lineItems.map((li) => (
            <div key={li.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <div className="font-semibold text-navy">{li.description}</div>
                <div className="text-xs text-charcoal/55">
                  {li.quantity} × {formatCurrency(li.unitPrice)}
                </div>
              </div>
              <div className="font-semibold text-navy">{formatCurrency(li.quantity * li.unitPrice)}</div>
            </div>
          ))}
        </div>
      </section>

      {quote.optionalAddons.length ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70">Optional add-ons</h2>
          <div className="mt-3 divide-y divide-navy/10 rounded-2xl border border-navy/10">
            {quote.optionalAddons.map((li) => (
              <div key={li.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div>
                  <div className="font-semibold text-navy">{li.description}</div>
                  <div className="text-xs text-charcoal/55">
                    {li.quantity} × {formatCurrency(li.unitPrice)}
                  </div>
                </div>
                <div className="font-semibold text-navy">{formatCurrency(li.quantity * li.unitPrice)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 rounded-2xl bg-sky/40 p-5 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Estimated total</div>
          <div className="mt-1 text-3xl font-bold text-navy">{formatCurrency(total)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Deposit</div>
          <div className="mt-1 text-xl font-semibold text-navy">{formatCurrency(quote.depositAmount)}</div>
          <div className="mt-2 text-xs text-charcoal/60">Remaining balance after deposit</div>
          <div className="text-lg font-bold text-leaf">{formatCurrency(remaining)}</div>
        </div>
      </section>

      <section className="mt-8 text-sm leading-relaxed text-charcoal/80">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70">Notes</h2>
        <p className="mt-2 whitespace-pre-line">{quote.notes}</p>
        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-navy/70">Terms</h3>
        <p className="mt-2 whitespace-pre-line">{quote.terms}</p>
      </section>

      <footer className="mt-10 border-t border-navy/10 pt-6 text-center text-xs text-charcoal/55 print:hidden">
        <PrintButton />
      </footer>
    </div>
  );
}
