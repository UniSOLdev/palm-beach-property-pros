import type { Metadata } from "next";
import Link from "next/link";
import { QUOTE_PATH, SERVICE_CITIES, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Area – Palm Beach County",
  description: `${SITE_NAME} serves West Palm Beach, Palm Beach Gardens, Jupiter, Delray Beach, and communities countywide.`,
};

const cities = SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby"));

export default function ServiceAreaPage() {
  return (
    <div className="bg-cream">
      <section className="mx-auto max-w-2xl px-6 py-16 text-center md:py-24">
        <p className="section-eyebrow text-ocean">Service area</p>
        <h1 className="section-title mt-3">Palm Beach County</h1>
        <p className="section-lead mt-4">
          {SITE_NAME} dispatches licensed crews for homes, rentals, retail, and HOA properties
          across the county.
        </p>
        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {cities.map((city) => (
            <li
              key={city}
              className="rounded-full border border-navy/10 bg-white px-3.5 py-1.5 text-sm font-medium text-navy shadow-sm"
            >
              {city}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-charcoal/60">{SERVICE_CITIES[SERVICE_CITIES.length - 1]}</p>
        <Link href={QUOTE_PATH} className="btn-primary mt-10 inline-flex min-h-[48px] px-8">
          Request a quote
        </Link>
      </section>
    </div>
  );
}
