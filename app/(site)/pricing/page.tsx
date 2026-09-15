import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import { getSiteHeroFallback } from "@/lib/marketing/service-images";
import { QUOTE_PATH, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Pricing",
  description: `${SITE_NAME} guide pricing for property restoration, cleaning, and maintenance — residential and commercial, Palm Beach County.`,
};

const overview = [
  { service: "Yard & Landscape Maintenance", price: "Custom quote by lot & frequency" },
  { service: "Window Cleaning", price: "Starting at $99" },
  { service: "Move-Out & Turnover Cleaning", price: "Starting at $200" },
  { service: "Trash & Debris Removal", price: "Custom quote by volume" },
  { service: "Residential Cleaning", price: "Starting at $120" },
  { service: "Deep Cleaning", price: "Starting at $200" },
  { service: "Commercial Cleaning", price: "Custom quote" },
  { service: "Pressure Washing / Exterior", price: "Starting at $129" },
  { service: "Carpet & Steam Cleaning", price: "Starting at $99" },
  { service: "Trash Can Cleaning", price: "Starting at $25" },
  { service: "Property Maintenance", price: "Custom quote" },
  { service: "Airbnb Turnover Services", price: "Custom quote" },
] as const;

const bundles = [
  {
    name: "Home Refresh",
    detail:
      "Interior priority clean plus glass touch-ups and light exterior freshening—priced after square footage review.",
  },
  {
    name: "Exterior Clean-Up",
    detail:
      "Driveway, walks, patio, and siding refresh as a coordinated day—scoped by substrate and access.",
  },
  {
    name: "Move-In / Move-Out",
    detail:
      "Detailed turnover cleaning with optional carpet extraction—timed to your closing or lease dates.",
  },
  {
    name: "Airbnb Turnover",
    detail:
      "Guest-ready cleaning aligned to check-in windows; linen and staging add-ons by agreement.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="bg-cream">
      <MarketingPageHero
        eyebrow="Pricing"
        title="Clear starting points, written before dispatch"
        lead="Guide pricing below helps you budget. Final scope reflects property size, soil level, access, and condition — confirmed in writing before work begins."
        image={getSiteHeroFallback()}
        cta={{ href: QUOTE_PATH, label: "Request a quote" }}
      />

      <section className="mx-auto max-w-6xl px-2 pb-16 md:pb-20">
        <h2 className="text-xl font-bold text-navy">Starting price overview</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky/60 text-navy">
              <tr>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Guide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {overview.map((row) => (
                <tr key={row.service} className="text-charcoal transition hover:bg-cream/60">
                  <td className="px-5 py-3.5 font-medium">{row.service}</td>
                  <td className="px-5 py-3.5 text-charcoal/90">{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-charcoal/80">
          Final pricing depends on scope and condition. Send photos for the fastest estimate.
        </p>

        <h2 className="mt-14 text-xl font-bold text-navy">Popular bundles</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {bundles.map((b) => (
            <article
              key={b.name}
              className="rounded-2xl border border-navy/10 bg-white p-5 text-sm leading-relaxed text-charcoal/90 shadow-sm"
            >
              <span className="text-base font-semibold text-navy">{b.name}</span>
              <p className="mt-2">{b.detail}</p>
            </article>
          ))}
        </div>

        <h2 className="mt-14 text-xl font-bold text-navy">How pricing works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "Photo estimates let us see height access, soil level, and material type before we commit to a price.",
            "Commercial accounts and multi-unit turnovers begin with a scope review, then a written proposal with frequency options.",
            "Custom packages consolidate labor and equipment when you need multiple services in one window.",
          ].map((text) => (
            <p
              key={text.slice(0, 24)}
              className="rounded-2xl border border-navy/[0.08] bg-white/80 p-5 text-sm leading-relaxed text-charcoal/90"
            >
              {text}
            </p>
          ))}
        </div>

        <div className="relative mt-12 overflow-hidden rounded-2xl bg-gradient-to-b from-charcoal to-navy-deep p-8 text-center text-cream shadow-luxury md:rounded-3xl">
          <p className="text-lg font-semibold">Request your written estimate</p>
          <p className="mt-2 text-sm text-silver/90">
            Submit your property details to send photos, select services, and receive pricing.
          </p>
          <Link href={QUOTE_PATH} className="btn-hero-primary mt-6 min-h-[48px] sm:w-auto">
            Request a quote
          </Link>
        </div>
      </section>
    </div>
  );
}
