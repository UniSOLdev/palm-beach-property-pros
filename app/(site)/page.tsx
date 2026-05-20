import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { FAQ_ITEMS } from "@/lib/faq";
import { HOME_SERVICE_SUMMARY } from "@/lib/home-service-summaries";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { SERVICES } from "@/lib/services";
import { getHomeCmsSections } from "@/lib/cms/home";
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

/** Trust strip — ordered for readability (matches primary service corridor messaging). */
const trustStripCities = [
  "West Palm Beach",
  "Palm Beach Gardens",
  "Jupiter",
  "Delray Beach",
  "Boynton Beach",
  "North Palm Beach",
  "Juno Beach",
] as const;

const processSteps = [
  "Request a Quote",
  "Send Photos or Details",
  "Written Scope Confirmation",
  "Scheduled Service",
  "Completion + Documentation",
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

const whyChooseItems = [
  { icon: "🛡", title: "Licensed & Insured", body: "Full accountability for residential and commercial work." },
  { icon: "🎯", title: "Surface-Appropriate Techniques", body: "Methods matched to substrate, exposure, and access." },
  { icon: "🏢", title: "Residential & Commercial Expertise", body: "Crews experienced with homes, retail, and offices." },
  { icon: "📋", title: "Clear Written Pricing", body: "Scope-based numbers you can plan around." },
  { icon: "📍", title: "Local Accountability", body: "Palm Beach County team—not a distant call center." },
] as const;

function sect(delayMs: number, className: string) {
  return {
    className: `section-soft-in ${className}`.trim(),
    style: { animationDelay: `${delayMs}ms` } as const,
  };
}

export default async function HomePage() {
  const cms = await getHomeCmsSections();
  const hero = cms.hero as {
    headline: string;
    subheadline: string;
    trust_bullets: string[];
  };
  const trustBand = cms.trust_band as {
    cities: string[];
    items: { icon: string; label: string }[];
  };
  const gallery = cms.results_gallery as {
    items: { label: string; image_url?: string }[];
  };
  const galleryItems =
    gallery.items?.length > 0
      ? gallery.items
      : beforeAfterPlaceholders.map((p) => ({ label: p.label }));

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-cream via-white to-white pb-24 pt-20 md:pb-28 md:pt-24">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/80 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 top-24 h-[22rem] w-[22rem] rounded-full bg-sky/40 blur-3xl md:right-10"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-navy md:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
            {hero.headline}
          </h1>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-charcoal/75 md:text-xl md:leading-relaxed">
            {hero.subheadline}
          </p>
          <ul className="mt-10 max-w-xl space-y-3 text-base font-medium text-charcoal/85 md:text-[1.05rem]">
            {hero.trust_bullets.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="text-ocean" aria-hidden>
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-12 flex max-w-xl flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-hero sm:min-w-[220px]">
              Get a Free Quote
            </a>
            <a href={PHONE_TEL} className="btn-secondary-lg sm:min-w-[220px]">
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <section {...sect(40, "border-y border-navy/[0.08] bg-white/90 py-8 md:py-9")}>
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
            Serving
          </p>
          <p className="mx-auto mt-3 max-w-5xl text-center text-sm leading-relaxed text-charcoal/80 md:text-[0.95rem]">
            {(trustBand.cities ?? [...trustStripCities]).join(" • ")}
          </p>
          <div
            className="mx-auto mt-8 grid max-w-4xl gap-6 border-t border-navy/[0.06] pt-8 sm:grid-cols-3 sm:gap-8"
            role="list"
          >
            <div className="flex flex-col items-center text-center" role="listitem">
              <span className="text-xl" aria-hidden>
                ⭐
              </span>
              <p className="mt-2 text-sm font-semibold text-navy">5-Star Local Service</p>
            </div>
            <div className="flex flex-col items-center text-center" role="listitem">
              <span className="text-xl" aria-hidden>
                📷
              </span>
              <p className="mt-2 text-sm font-semibold text-navy">Photo-Based Estimates</p>
            </div>
            <div className="flex flex-col items-center text-center" role="listitem">
              <span className="text-xl" aria-hidden>
                🛡
              </span>
              <p className="mt-2 text-sm font-semibold text-navy">Surface-Safe Methods</p>
            </div>
          </div>
        </div>
      </section>

      <section {...sect(80, "bg-cream/70 py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Book, Pay, or Leave a Review — All in One Place
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-charcoal/75">
            One secure quick access page for quotes, scheduling, invoices, and feedback—built for busy
            property owners.
          </p>
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary mt-10">
            Open Quick Access Page
          </a>
        </div>
      </section>

      <section {...sect(120, "bg-white py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Starting Investment</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-charcoal/75">
            Directional starting points by service type. Custom scopes and bundles are quoted after review.
          </p>
          <div
            className="mt-12 rounded-2xl border border-navy/12 bg-gradient-to-b from-white to-cream/40 p-8 shadow-card md:p-10"
          >
            <ul className="divide-y divide-navy/10">
              <li className="flex flex-col gap-1 py-5 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span className="text-base font-semibold text-navy">Window Cleaning</span>
                <span className="text-base tabular-nums text-charcoal/80">from $99</span>
              </li>
              <li className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span className="text-base font-semibold text-navy">Pressure Washing</span>
                <span className="text-base tabular-nums text-charcoal/80">from $129</span>
              </li>
              <li className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span className="text-base font-semibold text-navy">Auto Detailing</span>
                <span className="text-base tabular-nums text-charcoal/80">from $150</span>
              </li>
            </ul>
            <p className="mt-8 border-t border-navy/10 pt-6 text-center text-sm leading-relaxed text-charcoal/70">
              Final pricing confirmed in writing after reviewing scope and property condition.
            </p>
            <a
              href={LINKR_URL}
              target="_blank"
              rel={linkrRel}
              className="btn-primary mx-auto mt-8 flex w-full max-w-xs justify-center sm:mx-0"
            >
              Get a Free Quote
            </a>
            <Link
              href="/pricing"
              className="mt-6 block text-center text-sm font-semibold text-ocean no-underline hover:underline sm:text-left"
            >
              View full pricing guide →
            </Link>
          </div>
          <p className="mt-6 text-sm text-charcoal/65">Custom packages available.</p>
        </div>
      </section>

      <section {...sect(160, "bg-neutral-50 py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Core Services</h2>
            <p className="mt-5 text-lg leading-relaxed text-charcoal/75">
              Structured programs for homeowners, hosts, managers, HOAs, dealerships, storefronts, and
              small businesses.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <article
                key={s.slug}
                className="flex h-full flex-col rounded-2xl border border-navy/10 bg-white p-8 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <h3 className="text-lg font-bold text-navy">{s.name}</h3>
                <p className="mt-4 min-h-[4.5rem] flex-1 text-sm leading-relaxed text-charcoal/85">
                  {HOME_SERVICE_SUMMARY[s.slug]}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
                  <Link
                    href={`/services/${s.slug}`}
                    className="btn-secondary flex-1 py-3 text-center text-sm"
                  >
                    View Details
                  </Link>
                  <a
                    href={LINKR_URL}
                    target="_blank"
                    rel={linkrRel}
                    className="btn-primary flex-1 py-3 text-center text-sm"
                  >
                    Book / Quote
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section {...sect(200, "bg-white py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Real Results in Palm Beach County
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-charcoal/75">
            Representative project photography is added as we document new work. Each slot below is
            reserved for a labeled before/after pair.
          </p>
          <p className="mt-3 text-sm font-medium text-charcoal/65">
            Consistent documentation standards across Palm Beach County properties.
          </p>
          <ul className="mt-14 grid gap-8 sm:grid-cols-2">
            {galleryItems.map((item) => (
              <li
                key={item.label}
                className="group flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-sky/50 to-sand/40 transition duration-500 ease-out group-hover:scale-[1.02]">
                  {"image_url" in item && item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.label} className="h-full w-full object-cover" />
                  ) : (
                    <span className="sr-only">Photo placeholder</span>
                  )}
                </div>
                <p className="border-t border-navy/10 bg-cream/50 px-4 py-4 text-center text-sm font-semibold text-navy">
                  {item.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section {...sect(240, "bg-sand/35 py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Who We Work With</h2>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whoWeWorkWith.map((label) => (
              <li
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-navy/10 bg-white px-6 py-5 text-sm font-semibold text-navy shadow-card"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky text-ocean"
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

      <section {...sect(280, "bg-white py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Professional Cleaning Services in Palm Beach County
          </h2>
          <div className="mt-8 max-w-3xl space-y-6 text-base leading-relaxed text-charcoal/88 md:text-[1.05rem]">
            <p>
              {SITE_NAME} supports properties throughout {cityList}, and surrounding Palm Beach County
              neighborhoods. Whether you manage a storefront in West Palm Beach, a seasonal residence in
              Palm Beach Gardens, or rental inventory near Jupiter or Delray Beach, we align crews,
              equipment, and scheduling to local access realities—not generic national playbooks.
            </p>
            <p>
              Coastal humidity, pollen cycles, and salt exposure influence how finishes wear in Riviera
              Beach, Lake Worth, Boynton Beach, North Palm Beach, and Juno Beach. Our technicians select
              detergents, pressure levels, and dwell times suited to each substrate so results hold longer
              between visits.
            </p>
            <p>
              Use quick access to send photos, note timing constraints, and request written pricing. We
              respond with clear scope, starting price direction, and next available service dates.
            </p>
          </div>
        </div>
      </section>

      <section {...sect(320, "bg-neutral-50 py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Signature Service Packages
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-charcoal/75">
            Professionally structured bundles designed for efficiency, convenience, and long-term
            property care.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {packages.map((p) => (
              <article
                key={p.name}
                className="rounded-2xl border border-navy/10 bg-white p-8 shadow-card transition duration-300 hover:shadow-lift"
              >
                <h3 className="text-lg font-semibold text-navy">{p.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/85">{p.blurb}</p>
              </article>
            ))}
          </div>
          <div className="mt-12">
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-lg">
              Get a Free Quote
            </a>
          </div>
        </div>
      </section>

      <section {...sect(360, "bg-gradient-to-b from-cream/90 to-cream py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Why Choose Us</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-charcoal/75">
            Standards that protect your property, your time, and your reputation.
          </p>
          <ul className="mt-14 grid gap-6 md:grid-cols-6">
            {whyChooseItems.map((item, idx) => (
              <li
                key={item.title}
                className={`flex flex-col rounded-2xl border border-navy/10 bg-white/90 p-7 shadow-card ${
                  idx < 3 ? "md:col-span-2" : "md:col-span-3"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {item.icon}
                </span>
                <h3 className="mt-4 text-base font-bold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/80">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section {...sect(400, "bg-sky/35 py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Our Process</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-charcoal/75">
            A clear sequence from first message to documented completion.
          </p>

          <ol className="relative mt-14 space-y-0 border-l-2 border-navy/12 pl-8 md:hidden">
            {processSteps.map((step, i) => (
              <li key={step} className="relative pb-10 last:pb-0">
                <span className="absolute -left-[2.35rem] top-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-ocean bg-white text-sm font-bold text-ocean shadow-sm">
                  {i + 1}
                </span>
                <p className="pt-1.5 text-base font-semibold leading-snug text-navy">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 hidden md:block">
            <ol className="flex w-full items-start">
              {processSteps.map((label, i) => (
                <li key={label} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    <div
                      className={i === 0 ? "invisible h-px flex-1 bg-navy/15" : "h-px flex-1 bg-navy/15"}
                      aria-hidden
                    />
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ocean bg-white text-sm font-bold text-ocean shadow-sm">
                      {i + 1}
                    </span>
                    <div
                      className={
                        i === processSteps.length - 1
                          ? "invisible h-px flex-1 bg-navy/15"
                          : "h-px flex-1 bg-navy/15"
                      }
                      aria-hidden
                    />
                  </div>
                  <p className="mt-5 max-w-[11rem] text-center text-sm font-semibold leading-snug text-navy">
                    {label}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section {...sect(440, "bg-white py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Service Area</h2>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-ocean">Serving</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "West Palm Beach",
              "Palm Beach Gardens",
              "Jupiter",
              "Boynton Beach",
              "Delray Beach",
              "Lake Worth",
              "North Palm Beach",
              "Juno Beach",
            ].map((city) => (
              <li
                key={city}
                className="rounded-2xl border border-navy/10 bg-cream/60 px-5 py-3.5 text-sm font-medium text-navy shadow-sm"
              >
                {city}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm font-medium text-charcoal/75">
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

      <section {...sect(480, "bg-cream/80 py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">Documented Results</h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-charcoal/80 md:text-lg">
            Larger exterior and commercial projects include photo checklists and walkthrough notes so
            owners and managers retain a clear record of completed scope. Ask your estimator how
            documentation is handled for your property type.
          </p>
          <ul className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Before Photos",
                body: "Arrival documentation for transparency.",
              },
              {
                title: "During Service",
                body: "Surface-appropriate methods applied per agreed scope.",
              },
              {
                title: "After Walkthrough",
                body: "Final checklist and written confirmation provided.",
              },
            ].map((card) => (
              <li
                key={card.title}
                className="rounded-2xl border border-navy/10 bg-white p-7 text-sm leading-relaxed text-charcoal/85 shadow-card"
              >
                <h3 className="text-base font-bold text-navy">{card.title}</h3>
                <p className="mt-3">{card.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section {...sect(520, "bg-sand/30 py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
            Client Experience Standards
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-charcoal/85 md:text-lg">
            We build repeat relationships with homeowners, property managers, and business owners who
            expect predictable arrivals, respectful crews, and pricing that matches the agreed scope.
            Reviews and referrals are earned through consistent execution—not campaigns.
          </p>
          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              "Written scope confirmation before service day",
              "Uniformed technicians with identifiable vehicles",
              "Damage prevention protocols at entry points",
              "Supervisor availability for commercial and HOA work",
            ].map((line) => (
              <li
                key={line}
                className="rounded-2xl border border-navy/10 bg-white p-6 text-sm font-medium leading-relaxed text-charcoal shadow-card"
              >
                {line}
              </li>
            ))}
          </ul>
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-secondary mt-10">
            Leave a review
          </a>
        </div>
      </section>

      <section {...sect(560, "bg-white py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl border border-ocean/20 bg-gradient-to-br from-sky/40 to-white p-10 shadow-card sm:p-12">
            <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
              Photo-Forward Quotes
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-charcoal/85">
              Images of elevations, stains, or interior priorities help us price accurately without
              repeated site visits. Upload through quick access and note your target service week.
            </p>
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-lg mt-8">
              Get a Free Quote
            </a>
          </div>
        </div>
      </section>

      <section {...sect(600, "bg-neutral-50 py-20 md:py-24")}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">FAQ</h2>
          <div className="mt-10">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      <section className="border-t border-navy/10 bg-[#071525] py-24 text-cream md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white/[0.04] p-10 text-center shadow-lift ring-1 ring-white/10 backdrop-blur-sm md:p-14">
            <h2 className="text-3xl font-bold tracking-tight text-cream sm:text-4xl">Ready to Schedule?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cream/85">
              Send photos. Get clear pricing. Book with confidence.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-inverse-lg min-w-[200px]">
                Get a Free Quote
              </a>
              <a href={PHONE_TEL} className="btn-outline-light min-w-[200px]">
                Call {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
