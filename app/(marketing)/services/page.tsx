import type { Metadata } from "next";
import Link from "next/link";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SERVICES } from "@/lib/services";
import { SITE_NAME } from "@/lib/site";
import { getBusinessSettings } from "@/lib/admin/queries";
import {
  buildInvoicePaymentInstructionText,
  resolveBookingHref,
  resolveBookingLabel,
  resolvePaymentCtaLabel,
} from "@/lib/booking-settings";

export const metadata: Metadata = {
  title: "Cleaning & Property Services",
  description: `${SITE_NAME} — window cleaning, pressure washing, residential and commercial cleaning, detailing, carpet care, and maintenance in Palm Beach County. Licensed & insured.`,
};

export default async function ServicesPage() {
  const settings = await getBusinessSettings();
  const bookingHref = resolveBookingHref(settings);
  const bookingLabel = resolveBookingLabel(settings);
  const bookingExternal = bookingHref.startsWith("http");
  const payUrl = settings.squareInvoiceUrl?.trim();
  const payText = buildInvoicePaymentInstructionText(settings);

  return (
    <div className="bg-cream">
      <section className="w-full py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Services</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
          One local team for cleaning, detailing, and property care
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-charcoal/85">
          Browse services by property type, then open our quick access page to request pricing,
          book work, pay invoices, or leave a review.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {bookingExternal ? (
            <a href={bookingHref} target="_blank" rel="noopener noreferrer" className="btn-primary">
              {bookingLabel}
            </a>
          ) : (
            <Link href={bookingHref} className="btn-primary no-underline">
              {bookingLabel}
            </Link>
          )}
          {payUrl ? (
            <a href={payUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary border-ocean/40">
              {resolvePaymentCtaLabel(settings)}
            </a>
          ) : null}
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-secondary border-ocean/40">
            Quick access
          </a>
        </div>
        {!payUrl && payText ? (
          <p className="mt-4 max-w-2xl whitespace-pre-line rounded-2xl border border-navy/10 bg-white/80 p-4 text-sm text-charcoal/80">
            {payText}
          </p>
        ) : null}

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <article
              key={s.slug}
              id={s.anchor}
              className="scroll-mt-28 rounded-3xl border border-navy/10 bg-white p-6 shadow-card"
            >
              <h2 className="text-xl font-bold text-navy">{s.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{s.shortDescription}</p>
              <p className="mt-3 text-sm font-medium text-ocean">Best for</p>
              <p className="text-sm text-charcoal/85">{s.bestFor}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/services/${s.slug}`} className="btn-primary px-4 py-2 text-xs sm:text-sm">
                  Learn more
                </Link>
                {bookingExternal ? (
                  <a
                    href={bookingHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary px-4 py-2 text-xs sm:text-sm"
                  >
                    {bookingLabel}
                  </a>
                ) : (
                  <Link href={bookingHref} className="btn-secondary px-4 py-2 text-xs sm:text-sm no-underline">
                    {bookingLabel}
                  </Link>
                )}
                <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-secondary px-4 py-2 text-xs sm:text-sm">
                  Request pricing
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
