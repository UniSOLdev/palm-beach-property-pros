import Image from "next/image";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { FAQ_ITEMS } from "@/lib/faq";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80";
const MAINTENANCE_IMAGE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80";

const HERO_CHIPS = [
  "Licensed & insured",
  "Residential & commercial",
  "Airbnb & turnover specialists",
  "Palm Beach County based",
] as const;

const CARE_PLANS = [
  {
    eyebrow: "Weekly rhythm",
    title: "Weekly care",
    body: "High-touch homes and active storefronts that need a steady baseline year-round.",
  },
  {
    eyebrow: "Seasonal playbook",
    title: "Seasonal property plans",
    body: "Open, close, and peak-season refreshes for coastal estates and second homes.",
  },
  {
    eyebrow: "Owner-offsite coverage",
    title: "Vacation home care",
    body: "Coordinated visits while you are away—glass, exterior, and interior touchpoints.",
  },
  {
    eyebrow: "Per turnover",
    title: "Airbnb turnover programs",
    body: "Check-in aligned crews, linen resets, and staging details under your SOPs.",
  },
  {
    eyebrow: "Commercial cadence",
    title: "Storefront maintenance plans",
    body: "Glass, floors, and high-traffic zones matched to operating hours and traffic.",
  },
] as const;

const SERVICE_LINES = [
  {
    title: "Exterior care",
    body: "Curb presence, glass clarity, and exterior surfaces maintained to coastal standards.",
    links: [
      { href: "/services/window-cleaning", label: "Window cleaning" },
      { href: "/services/pressure-washing", label: "Pressure washing" },
      { href: "/services/auto-detailing", label: "Exterior detailing" },
    ],
  },
  {
    title: "Interior care",
    body: "Residences and interiors kept inspection-ready with repeatable crew standards.",
    links: [
      { href: "/services/residential-cleaning", label: "Residential cleaning" },
      { href: "/services/carpet-steam-cleaning", label: "Carpet cleaning" },
      { href: "/services/residential-cleaning", label: "Move-out cleaning" },
    ],
  },
  {
    title: "Property support",
    body: "Turnovers, light maintenance, and onsite support aligned with operations calendars.",
    links: [
      { href: "/services/airbnb-services", label: "Airbnb turnovers" },
      { href: "/services/property-maintenance", label: "Property maintenance" },
      { href: "/services/trash-can-cleaning", label: "Trash services" },
    ],
  },
] as const;

const WHO_WE_SERVE = [
  "Homeowners",
  "Airbnb hosts",
  "Property managers",
  "Dealerships",
  "Storefronts",
  "HOAs",
  "Seasonal residents",
] as const;

const HOW_IT_WORKS = [
  "Request a quote",
  "Share photos & access notes",
  "Receive written scope & schedule",
  "Crew executes to checklist",
] as const;

export function PremiumHomePage() {
  return (
    <>
      <section className="animate-fade-up relative -mx-4 overflow-hidden rounded-none bg-charcoal sm:-mx-6 md:mx-0 md:rounded-3xl">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Coastal luxury home exterior at dusk"
            fill
            priority
            className="object-cover object-center opacity-[0.5] md:opacity-55"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/45 md:hidden" aria-hidden />
          <div
            className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/85 to-charcoal/35 md:from-charcoal md:via-charcoal/80 md:to-charcoal/30"
            aria-hidden
          />
        </div>
        <div className="relative px-4 py-20 sm:px-6 sm:py-24 md:px-6 md:py-28">
          <div className="max-w-xl md:max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua/90 md:tracking-[0.28em]">
              Premium Property Operations
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-cream sm:text-5xl sm:leading-[1.08] md:text-5xl">
              Property Care for Palm Beach Living
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-silver/95 sm:text-lg md:mt-8 md:max-w-none md:text-xl">
              Residential, commercial, and coastal property services delivered with professional crews,
              modern systems, and detail-focused execution.
            </p>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            {HERO_CHIPS.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-cream/95 backdrop-blur-md md:text-xs"
              >
                {chip}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:max-w-none md:mt-10 md:max-w-3xl md:flex-row md:flex-wrap md:items-center">
            <Link
              href="/quote"
              className="btn-primary-lg min-h-[56px] w-full rounded-2xl text-center transition duration-200 active:scale-[0.98] sm:w-auto md:min-h-0 md:w-auto md:rounded-xl"
            >
              Get Free Quote
            </Link>
            <a
              href={PHONE_TEL}
              className="btn-secondary-lg min-h-[56px] w-full rounded-2xl border-white/25 bg-white/10 text-center text-cream transition duration-200 active:scale-[0.98] hover:bg-white/15 sm:w-auto md:min-h-0 md:w-auto md:rounded-2xl"
            >
              Call or Text {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <ScrollReveal>
      <section className="border-y border-navy/10 bg-white/60 py-10 backdrop-blur-sm md:py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 text-center">
          <h2 className="text-lg font-semibold tracking-tight text-navy">One secure client platform</h2>
          <p className="text-sm leading-relaxed text-charcoal/85 sm:text-base">
            Quotes, scheduling, invoices, payment, and approvals stay on Palm Beach Property Pros—so
            nothing gets lost between crews and your property stakeholders.
          </p>
          <Link href="/quote" className="btn-primary mx-auto mt-2">
            Request a quote
          </Link>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal delay={60}>
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean">Property care plans</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl md:text-4xl">
            Recurring programs, luxury cadence
          </h2>
          <p className="mt-4 text-charcoal/80">
            Predictable visits, documented scope, and crews aligned to how your property actually
            runs—not generic &quot;recurring cleanings.&quot;
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {CARE_PLANS.map((plan) => (
            <article
              key={plan.title}
              className="glass-panel group flex flex-col p-6 transition duration-500 hover:border-aqua/30 hover:shadow-glow"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-aqua/90">{plan.eyebrow}</p>
              <h3 className="mt-2 text-lg font-semibold text-navy">{plan.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/85">{plan.body}</p>
              <Link href="/quote" className="mt-5 text-sm font-semibold text-ocean no-underline hover:underline">
                Discuss a plan →
              </Link>
            </article>
          ))}
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal delay={120}>
      <section className="rounded-2xl border border-navy/10 bg-gradient-to-b from-white to-cream/80 py-12 shadow-card md:rounded-3xl md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean">Divisions</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl md:text-4xl">
            Organized service lines
          </h2>
          <p className="mt-4 text-charcoal/80">
            Exterior, interior, and property support—structured the way high-trust operators run field
            programs.
          </p>
        </div>
        <div className="mt-8 grid gap-8 md:mt-14 md:gap-10 lg:grid-cols-3">
          {SERVICE_LINES.map((line) => (
            <div key={line.title} className="flex flex-col">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-charcoal/80">{line.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{line.body}</p>
              <ul className="mt-6 space-y-3">
                {line.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between rounded-xl border border-navy/10 bg-white/80 px-4 py-3 text-sm font-medium text-navy shadow-sm no-underline transition hover:border-aqua/40 hover:shadow-md"
                    >
                      <span>{link.label}</span>
                      <span className="text-ocean transition group-hover:translate-x-0.5">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-charcoal/70">
          Crews, equipment, and checklists aligned to coastal substrates and access realities.
        </p>
      </section>
      </ScrollReveal>

      <section className="animate-fade-up py-12 md:py-20">
        <div className="grid min-w-0 gap-8 md:gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-navy/10 shadow-lift sm:min-h-[280px] md:min-h-[360px] md:rounded-3xl">
            <Image
              src={MAINTENANCE_IMAGE}
              alt="Professional property maintenance"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl md:text-4xl">Who we work with</h2>
            <p className="mt-4 text-charcoal/80">
              From estate driveways to dealership glass lines—one operations mindset: quiet execution,
              written scope, and repeatability.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3 md:grid-cols-3">
              {WHO_WE_SERVE.map((label) => (
                <li
                  key={label}
                  className="min-w-0 rounded-xl border border-navy/10 bg-white/90 px-3 py-3 text-center text-sm font-medium text-navy shadow-sm sm:px-4"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="animate-fade-up rounded-2xl border border-navy/10 bg-navy py-12 text-cream md:rounded-3xl md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Local operations, county-wide</h2>
          <p className="mt-4 text-cream/85">
            {SITE_NAME} runs programs throughout West Palm Beach, Palm Beach Gardens, Jupiter, Riviera
            Beach, Lake Worth, Boynton Beach, Delray Beach, North Palm Beach, Juno Beach, and nearby Palm
            Beach County areas. Coastal humidity, salt exposure, and seasonal occupancy patterns inform
            how we schedule exterior refreshes, interior care, and turnovers.
          </p>
          <Link href="/service-area" className="mt-6 inline-block text-sm font-semibold text-aqua no-underline hover:underline">
            View service area →
          </Link>
        </div>
      </section>

      <section className="animate-fade-up py-12 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl md:text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 md:mt-10 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
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

      <section className="animate-fade-up border-y border-navy/10 bg-white/70 py-12 backdrop-blur-sm md:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">Documentation &amp; trust</h2>
          <p className="mt-4 text-charcoal/85">
            Larger exterior and commercial scopes can include photo checklists and walkthrough notes so
            owners and property managers retain a clear record—ask how documentation is handled for your
            asset class.
          </p>
        </div>
      </section>

      <section className="animate-fade-up py-12 md:py-16">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">FAQ</h2>
          <div className="mt-8">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      <section className="animate-fade-up rounded-2xl border border-white/10 bg-charcoal px-4 py-12 text-center text-cream sm:px-6 md:rounded-3xl md:px-6 md:py-14">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready when you are</h2>
        <p className="mx-auto mt-3 max-w-xl text-cream/80">
          Same team for quotes, service delivery, invoices, and reviews—organized like modern property
          operations should be.
        </p>
        <div className="mt-8 flex w-full max-w-xl flex-col items-stretch gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/quote"
            className="btn-primary-lg min-h-[56px] w-full rounded-2xl transition duration-200 active:scale-[0.98] sm:w-auto md:rounded-xl"
          >
            Get Free Quote
          </Link>
          <a
            href={PHONE_TEL}
            className="btn-secondary-lg min-h-[56px] w-full rounded-2xl border-white/25 bg-white/10 text-cream transition duration-200 active:scale-[0.98] hover:bg-white/15 sm:w-auto md:rounded-2xl"
          >
            Call or Text {PHONE_DISPLAY}
          </a>
        </div>
      </section>
    </>
  );
}
