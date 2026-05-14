import type { Metadata } from "next";
import Link from "next/link";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SERVICE_CITIES, SITE_NAME } from "@/lib/site";
import { getBusinessSettings } from "@/lib/admin/queries";
import {
  buildInvoicePaymentInstructionText,
  resolveBookingHref,
  resolveBookingLabel,
  resolvePaymentCtaLabel,
} from "@/lib/booking-settings";

export const metadata: Metadata = {
  title: "Service Area – Palm Beach County",
  description: `${SITE_NAME} serves West Palm Beach, Palm Beach Gardens, Jupiter, Delray Beach, and communities countywide. Request scheduling via quick access.`,
};

const bullets = SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby"));

export default async function ServiceAreaPage() {
  const settings = await getBusinessSettings();
  const bookingHref = resolveBookingHref(settings);
  const bookingLabel = resolveBookingLabel(settings);
  const bookingExternal = bookingHref.startsWith("http");
  const payUrl = settings.squareInvoiceUrl?.trim();
  const payText = buildInvoicePaymentInstructionText(settings);

  return (
    <div className="bg-cream">
      <section className="mx-auto w-full max-w-3xl py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Service area</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Service Area – Palm Beach County</h1>
        <p className="mt-4 text-lg text-charcoal/85">
          {SITE_NAME} dispatches licensed crews across the county for homes, rentals, retail,
          offices, dealerships, and HOA-supported properties.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {bookingExternal ? (
            <a href={bookingHref} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
              {bookingLabel}
            </a>
          ) : (
            <Link href={bookingHref} className="btn-primary text-sm no-underline">
              {bookingLabel}
            </Link>
          )}
          {payUrl ? (
            <a href={payUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
              {resolvePaymentCtaLabel(settings)}
            </a>
          ) : null}
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-secondary text-sm">
            Quick access
          </a>
        </div>
        {!payUrl && payText ? (
          <p className="mt-4 whitespace-pre-line rounded-2xl border border-navy/10 bg-white/80 p-4 text-sm text-charcoal/80">{payText}</p>
        ) : null}

        <h2 className="mt-10 text-lg font-bold text-navy">Cities and communities</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {bullets.map((city) => (
            <li
              key={city}
              className="rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm font-medium text-navy shadow-card"
            >
              {city}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-charcoal/75">{SERVICE_CITIES[SERVICE_CITIES.length - 1]}</p>

        <h2 className="mt-10 text-lg font-bold text-navy">Scheduling</h2>
        <p className="mt-3 text-charcoal/90">
          We coordinate arrival windows around traffic patterns, HOA access rules, and your onsite
          contacts. Same-week service is offered when capacity allows; photo-based requests receive
          faster turnaround on pricing.
        </p>

        <div className="mt-10">
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary w-full sm:w-auto">
            Request service or a quote
          </a>
        </div>
      </section>
    </div>
  );
}
