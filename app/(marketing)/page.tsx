import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { FAQ_ITEMS } from "@/lib/faq";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SERVICES } from "@/lib/services";
import { PHONE_DISPLAY, SERVICE_CITIES, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Palm Beach County Window Cleaning, Pressure Washing & Property Maintenance",
  description: `${SITE_NAME} — professional residential and commercial cleaning, window cleaning, pressure washing, detailing, and maintenance across Palm Beach County. Licensed & insured. Fast quotes via quick access.`,
};

const packages = [
  {
    name: "Home Refresh Package",
    blurb: "Whole-home interior reset with glass touch-ups and optional light exterior freshening—scoped to your priorities.",
  },
  {
    name: "Exterior Clean-Up Package",
    blurb: "Driveway, walks, patio, and siding renewal planned around substrate type and landscaping protection.",
  },
  {
    name: "Move-In / Move-Out Cleaning",
    blurb: "Detailed turnover cleaning so the next resident arrives to a consistent, inspection-ready standard.",
  },
  {
    name: "Airbnb Turnover Support",
    blurb: "Check-in aligned cleaning with linen resets and staging touches when included in your scope.",
  },
  {
    name: "Business / Storefront Maintenance",
    blurb: "Recurring floors, glass, and restrooms matched to traffic patterns and operating hours.",
  },
  {
    name: "Auto Detail Add-On",
    blurb: "Interior and exterior detailing coordinated with other onsite services when scheduling allows.",
  },
] as const;

const cityList = SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby")).join(
  ", ",
);

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-sky/50 via-cream to-cream">
        <div className="w-full pb-16 pt-12 sm:pb-20 sm:pt-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
            Palm Beach County
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-navy md:text-5xl lg:leading-[1.1]">
            Palm Beach County Window Cleaning, Pressure Washing &amp; Property Maintenance
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/80 sm:text-xl">
            Professional residential and commercial cleaning services across Palm Beach County.
          </p>
          <p className="mt-4 text-sm font-semibold text-navy">
            Licensed &amp; insured. Local team. Fast quotes.
          </p>
          <div className="mt-8 flex max-w-xl flex-col gap-4 sm:flex-row sm:flex-wrap">
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-lg">
              Get a Free Quote
            </a>
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-secondary-lg">
              Call {PHONE_DISPLAY}
            </a>
            <Link
              href="/services"
              className="btn-secondary-lg border-navy/15 bg-cream hover:bg-sand/50"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-navy/10 bg-white py-6">
        <ul className="flex flex-wrap justify-center gap-6 text-sm text-charcoal/70">
          <li>Licensed &amp; insured</li>
          <li>Local Palm Beach County team</li>
          <li>Residential &amp; commercial</li>
          <li>Photo-based estimates</li>
        </ul>
      </section>

      <section className="bg-cream py-16">
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Book, Pay, or Leave a Review — All in One Place</h2>
          <p className="mt-4 max-w-2xl text-lg text-charcoal/85">
            Use our quick access page to request quotes, book services, pay invoices, or leave
            feedback in seconds.
          </p>
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary mt-8">
            Open Quick Access Page
          </a>
        </div>
      </section>

      <section className="bg-sand/50 py-16">
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Service Pricing Overview</h2>
          <ul className="mt-6 max-w-2xl space-y-2 text-charcoal/90">
            <li>Window cleaning starting at $99</li>
            <li>Pressure washing starting at $129</li>
            <li>Auto detailing starting at $150</li>
            <li>Custom packages available</li>
          </ul>
          <p className="mt-4 text-sm text-charcoal/80">
            Final pricing depends on scope and condition. Send photos for the fastest estimate.
          </p>
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-secondary mt-8">
            Request pricing
          </a>
          <Link
            href="/pricing"
            className="mt-4 ml-0 block text-sm font-semibold text-ocean no-underline hover:underline sm:ml-6 sm:inline-block"
          >
            View full pricing guide →
          </Link>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="w-full">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Core services</h2>
            <p className="mt-4 text-lg leading-relaxed text-charcoal/80">
              Benefit-driven programs for homeowners, Airbnb hosts, property managers, HOAs,
              dealerships, storefronts, and small businesses.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <article
                key={s.slug}
                className="flex flex-col rounded-3xl border border-navy/10 bg-white p-6 shadow-card"
              >
                <h3 className="text-lg font-semibold text-navy">{s.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal/90">
                  {s.shortDescription}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-sm font-semibold text-ocean no-underline hover:underline"
                  >
                    Service details →
                  </Link>
                  <a
                    href={LINKR_URL}
                    target="_blank"
                    rel={linkrRel}
                    className="text-sm font-semibold text-navy no-underline hover:underline"
                  >
                    Book / quote →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Professional Cleaning Services in Palm Beach County</h2>
          <div className="mt-6 max-w-3xl space-y-4 text-charcoal/90">
            <p>
              {SITE_NAME} supports properties throughout {cityList}, and surrounding Palm Beach
              County neighborhoods. Whether you manage a storefront in West Palm Beach, a seasonal
              residence in Palm Beach Gardens, or rental inventory near Jupiter or Delray Beach, we
              align crews, equipment, and scheduling to local access realities—not generic national
              playbooks.
            </p>
            <p>
              Coastal humidity, pollen cycles, and salt exposure influence how finishes wear in
              Riviera Beach, Lake Worth, Boynton Beach, North Palm Beach, and Juno Beach. Our
              technicians select detergents, pressure levels, and dwell times suited to each
              substrate so results hold longer between visits.
            </p>
            <p>
              Use quick access to send photos, note timing constraints, and request written pricing.
              We respond with clear scope, starting price direction, and next available service dates.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sand/50 py-16">
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Featured packages</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/80">
            Popular bundles we customize after square footage and access review. Every engagement is
            confirmed in writing before work begins.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {packages.map((p) => (
              <article
                key={p.name}
                className="rounded-3xl border border-navy/10 bg-white p-6 shadow-card"
              >
                <h3 className="text-lg font-semibold text-navy">{p.name}</h3>
                <p className="mt-2 text-sm text-charcoal/90">{p.blurb}</p>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-lg">
              Book or price a package
            </a>
          </div>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Why Choose Palm Beach Property Pros?</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              "Licensed & insured",
              "Surface-appropriate techniques",
              "Residential & commercial expertise",
              "Clear, upfront pricing",
              "Local Palm Beach County team",
            ].map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-leaf/25 bg-white p-5 text-sm font-medium text-charcoal shadow-card"
              >
                <span className="mr-2 text-leaf" aria-hidden>
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-sky/40 py-16">
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">How it works</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              "Request a quote",
              "Send photos or details",
              "Get scheduled",
              "We handle the work",
            ].map((step, i) => (
              <li
                key={step}
                className="rounded-3xl border border-navy/10 bg-white p-6 text-center shadow-card"
              >
                <span className="text-sm font-bold text-ocean">Step {i + 1}</span>
                <p className="mt-2 font-semibold text-navy">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Service area</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/80">
            Palm Beach County, including {cityList}, and{" "}
            {SERVICE_CITIES[SERVICE_CITIES.length - 1]}.
          </p>
          <Link
            href="/service-area"
            className="mt-6 inline-flex text-sm font-semibold text-ocean no-underline hover:underline"
          >
            View service area details →
          </Link>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Results documentation</h2>
          <p className="mt-4 max-w-3xl text-charcoal/90">
            Larger exterior and commercial projects include photo checklists and final walkthrough
            notes so owners and managers have a clear record of completed scope. Ask your estimator
            how documentation is handled for your property type.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Before photos",
                body: "Captured at arrival to record pre-existing conditions and set clear expectations.",
              },
              {
                title: "During service",
                body: "Technicians follow agreed methods for each surface class and access path.",
              },
              {
                title: "After walkthrough",
                body: "Final review confirms completed tasks and notes any follow-up items in writing.",
              },
            ].map((card) => (
              <li
                key={card.title}
                className="rounded-3xl border border-navy/10 bg-cream p-6 text-sm text-charcoal/90 shadow-card"
              >
                <h3 className="text-base font-semibold text-navy">{card.title}</h3>
                <p className="mt-2">{card.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-sand/40 py-16">
        <div className="w-full">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Client experience standards</h2>
          <p className="mt-4 max-w-3xl text-charcoal/90">
            We build repeat relationships with homeowners, property managers, and business owners
            who expect predictable arrivals, respectful crews, and pricing that matches the agreed
            scope. Reviews and referrals are earned through consistent execution—not campaigns.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "Written scope confirmation before service day",
              "Uniformed technicians with identifiable vehicles",
              "Damage prevention protocols at entry points",
              "Supervisor availability for commercial and HOA work",
            ].map((line) => (
              <li
                key={line}
                className="rounded-2xl border border-navy/10 bg-white p-5 text-sm font-medium text-charcoal shadow-card"
              >
                {line}
              </li>
            ))}
          </ul>
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-secondary mt-8">
            Leave a review
          </a>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="w-full">
          <div className="rounded-3xl border border-ocean/20 bg-sky/50 p-8 sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">
              Text photos for a faster quote
            </h2>
            <p className="mt-3 max-w-2xl text-charcoal/90">
              Images of each elevation, stain, or interior priority let us price accurately without
              repeated site visits. Upload through quick access and include your target service week.
            </p>
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-lg mt-6">
              Text photos for fast quote
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">FAQ</h2>
          <div className="mt-8">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      <section className="bg-navy py-14 text-cream">
        <div className="mx-auto w-full max-w-4xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-cream sm:text-3xl">
            Schedule your next service
          </h2>
          <p className="mt-3 text-cream/85">
            Quotes, bookings, invoices, and reviews are handled through one secure quick access page.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href={LINKR_URL}
              target="_blank"
              rel={linkrRel}
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-sm font-semibold text-navy no-underline hover:bg-sky"
            >
              Get a free quote
            </a>
            <a
              href={LINKR_URL}
              target="_blank"
              rel={linkrRel}
              className="inline-flex items-center justify-center rounded-lg border border-white/40 px-8 py-4 text-sm font-semibold text-white no-underline hover:bg-white/10"
            >
              Book service
            </a>
            <a
              href={LINKR_URL}
              target="_blank"
              rel={linkrRel}
              className="inline-flex items-center justify-center rounded-lg bg-leaf px-8 py-4 text-sm font-semibold text-navy no-underline hover:brightness-95"
            >
              Pay invoice / review
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
