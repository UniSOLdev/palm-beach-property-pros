import type { Metadata } from "next";
import { PbppCtaLink } from "@/components/pbpp-cta-link";
import { CTA_LABELS, PBPP_ROUTES } from "@/lib/cta-routes";
import { SERVICE_CITIES, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Area – Palm Beach County",
  description: `${SITE_NAME} serves West Palm Beach, Palm Beach Gardens, Jupiter, Delray Beach, and communities countywide. Request a quote or schedule service online.`,
};

const bullets = SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby"));

export default function ServiceAreaPage() {
  return (
    <div className="bg-cream">
      <section className="mx-auto w-full max-w-3xl py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Service area</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Service Area – Palm Beach County
        </h1>
        <p className="mt-4 text-lg text-charcoal/85">
          {SITE_NAME} dispatches licensed crews across the county for homes, rentals, retail,
          offices, dealerships, and HOA-supported properties.
        </p>

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
        <p className="mt-3 text-sm text-charcoal/75">
          {SERVICE_CITIES[SERVICE_CITIES.length - 1]}
        </p>

        <h2 className="mt-10 text-lg font-bold text-navy">Scheduling</h2>
        <p className="mt-3 text-charcoal/90">
          We coordinate arrival windows around traffic patterns, HOA access rules, and your onsite
          contacts. Same-week service is offered when capacity allows; photo-based requests receive
          faster turnaround on pricing.
        </p>

        <div className="mt-10">
          <PbppCtaLink href={PBPP_ROUTES.quote} className="btn-primary w-full sm:w-auto">
            {CTA_LABELS.getAFreeQuote}
          </PbppCtaLink>
        </div>
      </section>
    </div>
  );
}
