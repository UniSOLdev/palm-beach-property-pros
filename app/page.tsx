import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { FAQ_ITEMS } from "@/lib/faq";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SERVICES } from "@/lib/services";
import { PHONE_DISPLAY, PHONE_TEL, SERVICE_CITIES, SITE_NAME } from "@/lib/site";

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

const servingList = [
  "West Palm Beach",
  "Palm Beach Gardens",
  "Jupiter",
  "Boynton Beach",
  "Delray Beach",
  "Lake Worth",
  "North Palm Beach",
  "Juno Beach",
] as const;

const pricingCards = [
  {
    title: "Window Cleaning",
    price: "Starting at $99",
    bullets: ["Interior & exterior", "Screens & frames", "Streak-free finish"],
  },
  {
    title: "Pressure Washing",
    price: "Starting at $129",
    bullets: ["Driveways", "Walkways", "Patios & siding"],
  },
  {
    title: "Auto Detailing",
    price: "Starting at $150",
    bullets: ["Interior deep clean", "Exterior wash & protection", "Trim & wheel care"],
  },
] as const;

const beforeAfterPlaceholders = [
  { label: "Driveway before / after" },
  { label: "Window cleaning" },
  { label: "Auto detail interior" },
  { label: "Trash bin cleaning" },
] as const;

const whoWeWorkWith = [
  "Homeowners",
  "Property Managers",
  "Airbnb Hosts",
  "Storefronts & Offices",
  "Dealerships",
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50/90 to-cream py-20 pt-16 md:pt-20">
        <div
          className="pointer-events-none absolute -left-24 top-0 h-[28rem] w-[28rem] rounded-full bg-sky/25 blur-3xl md:left-1/2 md:-translate-x-1/2"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-ocean">
            Palm Beach County
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight text-navy md:text-5xl lg:text-6xl lg:leading-[1.08]">
            <span className="block">Professional Property Cleaning &amp; Maintenance</span>
            <span className="mt-3 block text-3xl font-bold tracking-tight text-navy md:text-4xl lg:text-5xl">
              Serving Palm Beach County
            </span>
          </h1>
          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-charcoal/80 sm:text-xl">
            Window cleaning, pressure washing, detailing, and full-service property care —
            residential &amp; commercial. Licensed. Insured. Local.
          </p>
          <div className="mt-10 flex max-w-2xl flex-col gap-4 sm:flex-row sm:flex-wrap">
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-hero">
              Get a Fast Photo Quote
            </a>
            <a href={PHONE_TEL} className="btn-secondary-lg">
              Call {PHONE_DISPLAY}
            </a>
            <Link
              href="/services"
              className="btn-secondary-lg border-navy/15 bg-cream/80 hover:bg-sand/60"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-navy/10 bg-gradient-to-r from-sky/25 via-white to-sky/20 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <ul className="flex flex-col items-stretch justify-between gap-6 text-sm font-medium tracking-wide text-charcoal sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-10">
            <li className="flex items-center gap-3">
              <span className="text-lg text-leaf" aria-hidden>
                ✔
              </span>
              Licensed &amp; Insured
            </li>
            <li className="flex items-center gap-3">
              <span className="text-lg text-leaf" aria-hidden>
                ✔
              </span>
              Local Palm Beach County Team
            </li>
            <li className="flex items-center gap-3">
              <span className="text-lg text-leaf" aria-hidden>
                ✔
              </span>
              Photo-Based Estimates
            </li>
            <li className="flex items-center gap-3">
              <span className="text-lg text-leaf" aria-hidden>
                ✔
              </span>
              Residential &amp; Commercial
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Book, Pay, or Leave a Review — All in One Place
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/80">
            Use our quick access page to request quotes, book services, pay invoices, or leave
            feedback in seconds.
          </p>
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary mt-8">
            Open Quick Access Page
          </a>
        </div>
      </section>

      <section className="bg-sand/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Service Pricing Overview
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/80">
            Final pricing depends on scope and condition. Send photos for the fastest estimate.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pricingCards.map((card) => (
              <article
                key={card.title}
                className="flex h-full flex-col rounded-xl border border-navy/10 bg-white p-6 shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal/70">
                  {card.title}
                </h3>
                <p className="mt-2 text-2xl font-bold tracking-tight text-navy">{card.price}</p>
                <div className="my-4 border-t border-navy/10" aria-hidden />
                <ul className="flex-1 space-y-2 text-sm leading-relaxed text-charcoal/90">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-ocean" aria-hidden>
                        •
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={LINKR_URL}
                  target="_blank"
                  rel={linkrRel}
                  className="btn-primary mt-6 w-full"
                >
                  Get Quote
                </a>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-charcoal/75">Custom packages available.</p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex text-sm font-semibold text-ocean no-underline hover:underline"
          >
            View full pricing guide →
          </Link>
        </div>
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Core services</h2>
            <p className="mt-4 text-lg leading-relaxed text-charcoal/80">
              Benefit-driven programs for homeowners, Airbnb hosts, property managers, HOAs,
              dealerships, storefronts, and small businesses.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <article
                key={s.slug}
                className="flex h-full flex-col rounded-xl border border-navy/10 bg-white p-6 shadow-md transition duration-200 hover:shadow-lg"
              >
                <h3 className="text-lg font-bold text-navy">{s.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/90">{s.shortDescription}</p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                  <Link
                    href={`/services/${s.slug}`}
                    className="btn-secondary flex-1 py-2.5 text-center text-sm"
                  >
                    Service details
                  </Link>
                  <a
                    href={LINKR_URL}
                    target="_blank"
                    rel={linkrRel}
                    className="btn-primary flex-1 py-2.5 text-center text-sm"
                  >
                    Get quote
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Real Results in Palm Beach County
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/80">
            Representative project photography is added as we document new work. Each gallery slot
            below is reserved for a labeled before/after pair.
          </p>
          <p className="mt-2 text-sm font-medium text-charcoal/70">
            Documented results across Palm Beach County properties.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {beforeAfterPlaceholders.map((item) => (
              <li
                key={item.label}
                className="group flex flex-col overflow-hidden rounded-xl border border-navy/10 bg-white shadow-md transition duration-300 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-sky/50 to-sand/40 transition duration-500 ease-out group-hover:scale-[1.03]">
                  <span className="sr-only">Photo placeholder</span>
                </div>
                <p className="border-t border-navy/10 bg-cream/50 px-4 py-3 text-center text-sm font-semibold text-navy">
                  {item.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-sand/40 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Who We Work With</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whoWeWorkWith.map((label) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-xl border border-navy/10 bg-white px-5 py-4 text-sm font-semibold text-navy shadow-md"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky text-ocean"
                  aria-hidden
                >
                  ✓
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Professional Cleaning Services in Palm Beach County
          </h2>
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
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Featured packages
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/80">
            Popular bundles we customize after square footage and access review. Every engagement is
            confirmed in writing before work begins.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {packages.map((p) => (
              <article
                key={p.name}
                className="rounded-xl border border-navy/10 bg-white p-6 shadow-md"
              >
                <h3 className="text-lg font-semibold text-navy">{p.name}</h3>
                <p className="mt-2 text-sm text-charcoal/90">{p.blurb}</p>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-lg">
              Get a Free Quote
            </a>
          </div>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Why Choose Palm Beach Property Pros?
          </h2>
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
                className="rounded-xl border border-leaf/25 bg-white p-5 text-sm font-medium text-charcoal shadow-md"
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
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              "Request a quote",
              "Send photos or details",
              "Get scheduled",
              "We handle the work",
            ].map((step, i) => (
              <li
                key={step}
                className="rounded-xl border border-navy/10 bg-white p-6 text-center shadow-md"
              >
                <span className="text-sm font-bold text-ocean">Step {i + 1}</span>
                <p className="mt-2 font-semibold text-navy">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Service area
          </h2>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-ocean">Serving</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {servingList.map((city) => (
              <li
                key={city}
                className="rounded-xl border border-navy/10 bg-cream px-4 py-3 text-sm font-medium text-navy"
              >
                {city}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-medium text-charcoal">
            Same-week scheduling available in most areas.
          </p>
          <Link
            href="/service-area"
            className="mt-6 inline-flex text-sm font-semibold text-ocean no-underline hover:underline"
          >
            View service area details →
          </Link>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Results documentation
          </h2>
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
                className="rounded-xl border border-navy/10 bg-white p-6 text-sm text-charcoal/90 shadow-md"
              >
                <h3 className="text-base font-semibold text-navy">{card.title}</h3>
                <p className="mt-2">{card.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-sand/40 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Client experience standards
          </h2>
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
                className="rounded-xl border border-navy/10 bg-white p-5 text-sm font-medium text-charcoal shadow-md"
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
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-xl border border-ocean/20 bg-sky/50 p-8 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
              Text photos for a faster quote
            </h2>
            <p className="mt-4 max-w-2xl text-charcoal/90">
              Images of each elevation, stain, or interior priority let us price accurately without
              repeated site visits. Upload through quick access and include your target service week.
            </p>
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-lg mt-6">
              Get a Fast Photo Quote
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">FAQ</h2>
          <div className="mt-8">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      <section className="bg-navy py-20 text-cream">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl rounded-xl bg-white/[0.06] p-10 text-center shadow-md ring-1 ring-white/10 md:p-14">
            <h2 className="text-3xl font-bold tracking-tight text-cream sm:text-4xl">
              Ready to Schedule Your Service?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/85">
              Send photos for the fastest estimate or book directly through our secure access page.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-inverse-lg">
                Get a Free Quote
              </a>
              <a href={PHONE_TEL} className="btn-outline-light">
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
