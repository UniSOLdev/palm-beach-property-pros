import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import { getServiceAreaImage } from "@/lib/marketing/service-images";
import { QUOTE_PATH, SERVICE_CITIES, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Area – Palm Beach County",
  description: `${SITE_NAME} serves West Palm Beach, Palm Beach Gardens, Jupiter, Delray Beach, and communities countywide.`,
};

const cities = SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby"));

export default function ServiceAreaPage() {
  return (
    <div className="bg-cream">
      <MarketingPageHero
        eyebrow="Service area"
        title="Palm Beach County"
        lead={`${SITE_NAME} dispatches licensed crews for homes, rentals, retail, and HOA properties across the county.`}
        image={getServiceAreaImage()}
        cta={{ href: QUOTE_PATH, label: "Request a quote" }}
      />

      <section className="mx-auto max-w-3xl px-2 pb-16 text-center md:pb-24">
        <ul className="flex flex-wrap justify-center gap-2">
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
      </section>
    </div>
  );
}
