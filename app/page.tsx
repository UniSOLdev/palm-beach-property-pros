import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { FAQ_ITEMS } from "@/lib/faq";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { PROPERTY_CARE_PLANS, SERVICE_DIVISIONS } from "@/lib/service-divisions";
import {
  BRAND_ESSENCE,
  HERO_HEADLINE,
  HERO_SUBHEADLINE,
  PHONE_DISPLAY,
  PHONE_TEL,
  SERVICE_CITIES,
  SITE_NAME,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Premium Property Operations & Care in Palm Beach County",
  description: `${SITE_NAME} — ${HERO_SUBHEADLINE} Licensed & insured. Palm Beach County based.`,
};

const cityList = SERVICE_CITIES.filter((c) => !c.toLowerCase().startsWith("and nearby")).join(
  ", ",
);

const trustPills = [
  "Licensed & insured",
  "Residential & commercial",
  "Airbnb & turnover specialists",
  "Palm Beach County based",
] as const;

const whoWeWorkWith = [
  "Homeowners",
  "Airbnb hosts",
  "Property managers",
  "Dealerships",
  "Storefronts",
  "HOAs",
  "Seasonal residents",
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative -mx-6 overflow-hidden rounded-none bg-charcoal md:mx-0 md:rounded-3xl">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80"
            alt="Coastal luxury home exterior at dusk"
            fill
            priority
            className="object-cover opacity-55"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/30" />
        </div>
        <div className="relative px-6 py-20 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-aqua/90">
            {BRAND_ESSENCE}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-cream sm:text-5xl sm:leading-[1.08]">
            {HERO_HEADLINE}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-silver/95 sm:text-xl">
            {HERO_SUBHEADLINE}
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {trustPills.map((t) => (
              <li
                key={t}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-cream/95 backdrop-blur-md"
              >
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-lg text-center">
              Get Free Quote
            </a>
            <a href={PHONE_TEL} className="btn-secondary-lg text-center">
              Call or Text {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <section className="animate-fade-up border-y border-navy/10 bg-white/60 py-10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 text-center">
          <h2 className="text-lg font-semibold tracking-tight text-navy">One secure operations link</h2>
          <p className="text-sm leading-relaxed text-charcoal/85 sm:text-base">
            Quotes, scheduling, invoices, payment, and review requests stay in a single client flow—so
            nothing gets lost between crews and your property stakeholders.
          </p>
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary mx-auto mt-2">
            Open client portal
          </a>
        </div>
      </section>

      <section className="animate-fade-up py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean">Property care plans</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Recurring programs, luxury cadence
          </h2>
          <p className="mt-4 text-charcoal/80">
            Predictable visits, documented scope, and crews aligned to how your property actually runs—not
            generic &quot;recurring cleanings.&quot;
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PROPERTY_CARE_PLANS.map((p) => (
            <article
              key={p.name}
              className="group glass-panel img-zoom flex flex-col p-6 transition duration-500 hover:border-aqua/30 hover:shadow-glow"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-aqua/90">{p.cadence}</p>
              <h3 className="mt-2 text-lg font-semibold text-navy">{p.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/85">{p.description}</p>
              <a
                href={LINKR_URL}
                target="_blank"
                rel={linkrRel}
                className="mt-5 text-sm font-semibold text-ocean no-underline hover:underline"
              >
                Discuss a plan →
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="animate-fade-up rounded-3xl border border-navy/10 bg-gradient-to-b from-white to-cream/80 py-20 shadow-card">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean">Divisions</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Organized service lines
          </h2>
          <p className="mt-4 text-charcoal/80">
            Exterior, interior, and property support—structured the way high-trust operators run field
            programs.
          </p>
        </div>
        <div className="mt-14 grid gap-10 lg:grid-cols-3">
          {SERVICE_DIVISIONS.map((div) => (
            <div key={div.id} className="flex flex-col">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-graphite/80">{div.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{div.subtitle}</p>
              <ul className="mt-6 space-y-3">
                {div.services.map((s) => (
                  <li key={`${div.id}-${s.slug}-${s.label}`}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-navy/10 bg-white/80 px-4 py-3 text-sm font-medium text-navy shadow-sm no-underline transition hover:border-aqua/40 hover:shadow-md"
                    >
                      <span>{s.label}</span>
                      <span className="text-ocean transition group-hover:translate-x-0.5">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-fade-up py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="img-zoom group relative min-h-[280px] overflow-hidden rounded-3xl border border-navy/10 shadow-lift sm:min-h-[360px]">
            <Image
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
              alt="Professional property maintenance"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-charcoal/70 to-transparent" />
            <p className="absolute bottom-6 left-6 max-w-xs text-sm font-medium text-cream">
              Crews, equipment, and checklists aligned to coastal substrates and access realities.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">Who we work with</h2>
            <p className="mt-4 text-charcoal/85">
              From estate driveways to dealership glass lines—one operations mindset: quiet execution,
              written scope, and repeatability.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {whoWeWorkWith.map((w) => (
                <li
                  key={w}
                  className="rounded-xl border border-navy/10 bg-white/90 px-4 py-3 text-center text-sm font-medium text-navy shadow-sm"
                >
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="animate-fade-up rounded-3xl border border-navy/10 bg-navy py-16 text-cream">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Local operations, county-wide</h2>
          <p className="mt-4 text-cream/85">
            {SITE_NAME} runs programs throughout {cityList}, and nearby Palm Beach County areas. Coastal
            humidity, salt exposure, and seasonal occupancy patterns inform how we schedule exterior
            refreshes, interior care, and turnovers.
          </p>
          <Link
            href="/service-area"
            className="mt-6 inline-block text-sm font-semibold text-aqua no-underline hover:underline"
          >
            View service area →
          </Link>
        </div>
      </section>

      <section className="animate-fade-up py-20">
        <h2 className="text-3xl font-semibold tracking-tight text-navy">How it works</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Request a quote",
            "Share photos & access notes",
            "Receive written scope & schedule",
            "Crew executes to checklist",
          ].map((step, i) => (
            <li
              key={step}
              className="rounded-2xl border border-navy/10 bg-white/90 p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-aqua/35 hover:shadow-lift"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-aqua">Step {i + 1}</span>
              <p className="mt-3 font-semibold text-navy">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="animate-fade-up border-y border-navy/10 bg-white/70 py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">Documentation & trust</h2>
          <p className="mt-4 text-charcoal/85">
            Larger exterior and commercial scopes can include photo checklists and walkthrough notes so
            owners and property managers retain a clear record—ask how documentation is handled for your
            asset class.
          </p>
        </div>
      </section>

      <section className="animate-fade-up py-16">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">FAQ</h2>
          <div className="mt-8">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      <section className="animate-fade-up rounded-3xl border border-white/10 bg-charcoal px-6 py-14 text-center text-cream">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready when you are</h2>
        <p className="mx-auto mt-3 max-w-xl text-cream/80">
          Same team for quotes, service delivery, invoices, and reviews—organized like modern property
          operations should be.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <a href={LINKR_URL} target="_blank" rel={linkrRel} className="btn-primary-lg">
            Get Free Quote
          </a>
          <a href={PHONE_TEL} className="btn-secondary-lg border-cream/25 bg-transparent text-cream">
            Call or Text {PHONE_DISPLAY}
          </a>
        </div>
      </section>
    </>
  );
}
