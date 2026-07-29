import type { Metadata } from "next";
import Link from "next/link";
import { PRIMARY_LOCATION_SLUGS, LOCATION_PAGES } from "@/lib/locations";
import { CTA } from "@/lib/cta";
import { QUOTE_PATH, SERVICE_CITIES, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Area – Palm Beach County",
  description: `${SITE_NAME} serves Palm Beach, West Palm Beach, Palm Beach Gardens, Jupiter, Wellington, Lake Worth Beach, and communities countywide.`,
  alternates: { canonical: `${SITE_URL}/service-area` },
};

const bullets = SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby"));

export default function ServiceAreaPage() {
  const featuredLocations = PRIMARY_LOCATION_SLUGS.map(
    (slug) => LOCATION_PAGES.find((l) => l.slug === slug)!,
  );

  return (
    <div className="bg-cream">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Service area</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Serving Palm Beach County
        </h1>
        <p className="mt-4 text-lg text-charcoal/85">
          {SITE_NAME} provides cleaning, exterior care, property care, and mobile detailing for
          homes, rentals, retail, offices, and managed properties across the county.
        </p>

        <h2 className="mt-10 text-lg font-bold text-navy">Featured service areas</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredLocations.map((loc) => (
            <li key={loc.slug}>
              <Link
                href={`/areas/${loc.slug}`}
                className="block rounded-xl border border-navy/10 bg-white px-4 py-4 text-sm font-medium text-navy shadow-md no-underline transition hover:border-ocean/30 hover:shadow-lg"
              >
                {loc.name}
                <span className="mt-1 block text-xs font-normal text-charcoal/60">
                  View local services →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-lg font-bold text-navy">Additional cities and communities</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {bullets.map((city) => (
            <li
              key={city}
              className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm font-medium text-navy shadow-md"
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
          contacts. Photo-based requests help us return accurate estimates faster.
        </p>

        <div className="mt-10">
          <Link href={QUOTE_PATH} className="btn-primary w-full sm:w-auto">
            {CTA.primaryEstimate}
          </Link>
        </div>
      </section>
    </div>
  );
}
