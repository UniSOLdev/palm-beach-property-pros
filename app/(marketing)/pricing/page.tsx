import type { Metadata } from "next";
import Link from "next/link";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Pricing",
  description: `${SITE_NAME} starting prices for window cleaning, pressure washing, detailing, residential cleaning, and more in Palm Beach County. Scope-based quotes through quick access.`,
};

const overview = [
  { service: "Window Cleaning", price: "Starting at $99" },
  { service: "Residential Cleaning", price: "Starting at $120" },
  { service: "Deep Cleaning", price: "Starting at $200" },
  { service: "Commercial Cleaning", price: "Custom quote" },
  { service: "Pressure Washing / Exterior", price: "Starting at $129" },
  { service: "Auto Detailing", price: "Starting at $150" },
  { service: "Full Detail", price: "Starting at $250" },
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
      <section className="mx-auto w-full max-w-3xl py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Pricing</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Service Pricing – {SITE_NAME}
        </h1>
        <p className="mt-4 text-lg text-charcoal/85">
          Starting points below help you budget. Final pricing reflects property size, soil level,
          access, and scope confirmed before work begins.
        </p>

        <h2 className="mt-12 text-xl font-bold text-navy">Starting price overview</h2>
        <div className="mt-4 overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky/60 text-navy">
              <tr>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Guide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {overview.map((row) => (
                <tr key={row.service} className="text-charcoal">
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
        <p className="mt-3 text-charcoal/85">
          Bundles combine interior, exterior, and specialty tasks into one coordinated visit when
          scheduling allows. Each bundle is confirmed in writing after review.
        </p>
        <ul className="mt-6 space-y-4">
          {bundles.map((b) => (
            <li
              key={b.name}
              className="rounded-3xl border border-navy/10 bg-white p-5 text-sm text-charcoal/90 shadow-card"
            >
              <span className="font-semibold text-navy">{b.name}</span>
              <span className="mt-1 block">{b.detail}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-14 text-xl font-bold text-navy">How pricing works</h2>
        <div className="mt-4 space-y-4 text-charcoal/90">
          <p>
            Photo estimates let us see height access, soil level, and material type before we
            commit to a price. That reduces surprises on service day and keeps scheduling realistic.
          </p>
          <p>
            Commercial accounts, HOA common areas, and multi-unit turnovers typically begin with a
            short scope review—photos, site notes, or a brief walkthrough—then a written proposal
            with frequency options.
          </p>
          <p>
            Custom packages are available when you need multiple services in one window. We
            consolidate labor and equipment where it saves time without cutting quality.
          </p>
        </div>

        <div className="mt-12 rounded-3xl bg-navy p-8 text-center text-cream shadow-lift">
          <p className="text-lg font-semibold">Request your written estimate</p>
          <p className="mt-2 text-sm text-cream/85">
            Open quick access to send photos, select services, and receive pricing.
          </p>
          <a
            href={LINKR_URL}
            target="_blank"
            rel={linkrRel}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-4 text-sm font-semibold text-navy no-underline hover:bg-sky sm:w-auto"
          >
            Open quick access page
          </a>
          <Link
            href="/quote"
            className="mt-6 inline-block text-sm font-semibold text-sky no-underline underline-offset-2 hover:underline"
          >
            Read quote request details →
          </Link>
        </div>
      </section>
    </div>
  );
}
