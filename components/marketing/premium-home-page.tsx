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
      <section className="hero-cinematic animate-fade-up relative -mx-4 sm:-mx-6 md:mx-0 md:rounded-3xl">
        <div className="absolute inset-0 md:rounded-3xl">
          <Image
            src={HERO_IMAGE}
            alt="Coastal luxury home exterior at dusk"
            fill
            priority
            className="object-cover object-[center_35%] opacity-[0.48] saturate-[0.92] md:opacity-[0.52]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/50 md:hidden" aria-hidden />
          <div
            className="absolute inset-0 bg-gradient-to-t from-navy-deep via-charcoal/90 to-charcoal/40 md:rounded-3xl md:from-navy-deep md:via-navy/85 md:to-navy/25"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-luxury-radial opacity-80 md:rounded-3xl"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-luxury-vignette md:rounded-3xl"
            aria-hidden
          />
          <div className="hero-grain absolute inset-0 md:rounded-3xl" aria-hidden />
        </div>

        <div className="relative px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-32 lg:py-36">
          <div className="max-w-xl md:max-w-3xl">
            <p className="section-eyebrow text-aqua/90 md:tracking-[0.32em]">
              Premium Property Operations
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-cream sm:text-5xl md:mt-7 md:text-[3.25rem] md:leading-[1.06]">
              Property Care for Palm Beach Living
            </h1>
            <p className="mt-7 max-w-xl text-base leading-[1.75] text-silver/95 sm:text-lg md:mt-9 md:max-w-2xl md:text-xl md:leading-[1.7]">
              Residential, commercial, and coastal property services delivered with professional crews,
              modern systems, and detail-focused execution.
            </p>
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-2.5 md:mt-12 md:justify-start md:gap-3">
            {HERO_CHIPS.map((chip) => (
              <li key={chip} className="luxury-pill">
                {chip}
              </li>
            ))}
          </ul>

          <div className="mt-12 flex w-full max-w-xl flex-col gap-3 sm:max-w-none md:mt-14 md:max-w-3xl md:flex-row md:flex-wrap md:items-center md:gap-4">
            <Link href="/quote" className="btn-hero-primary min-h-[56px] w-full sm:w-auto">
              Get Free Quote
            </Link>
            <a href={PHONE_TEL} className="btn-hero-secondary min-h-[56px] w-full sm:w-auto">
              Call or Text {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <div className="section-divider my-2 md:my-4" aria-hidden />

      <ScrollReveal>
        <section className="section-band-light">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title">One secure client platform</h2>
            <p className="section-lead">
              Quotes, scheduling, invoices, payment, and approvals stay on Palm Beach Property Pros—so
              nothing gets lost between crews and your property stakeholders.
            </p>
            <Link href="/quote" className="btn-primary mx-auto mt-8 inline-flex">
              Request a quote
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={60}>
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Property care plans</p>
            <h2 className="section-title mt-4">Recurring programs, luxury cadence</h2>
            <p className="section-lead">
              Predictable visits, documented scope, and crews aligned to how your property actually
              runs—not generic &quot;recurring cleanings.&quot;
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {CARE_PLANS.map((plan) => (
              <article key={plan.title} className="luxury-card group flex flex-col">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua-muted">
                  {plan.eyebrow}
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-navy">{plan.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-charcoal/75">{plan.body}</p>
                <Link href="/quote" className="link-luxury mt-6 inline-block">
                  Discuss a plan
                </Link>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <section className="section-band-warm">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Divisions</p>
            <h2 className="section-title mt-4">Organized service lines</h2>
            <p className="section-lead">
              Exterior, interior, and property support—structured the way high-trust operators run field
              programs.
            </p>
          </div>
          <div className="mt-14 grid gap-12 md:gap-14 lg:grid-cols-3">
            {SERVICE_LINES.map((line) => (
              <div key={line.title} className="flex flex-col border-t border-navy/[0.08] pt-8 lg:border-t-0 lg:pt-0">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-charcoal/70">
                  {line.title}
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-charcoal/70">{line.body}</p>
                <ul className="mt-8 space-y-3">
                  {line.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group flex items-center justify-between rounded-xl border border-navy/[0.08] bg-white/70 px-4 py-3.5 text-sm font-medium text-navy shadow-sm no-underline backdrop-blur-sm transition duration-300 hover:border-aqua/25 hover:bg-white hover:shadow-card"
                      >
                        <span>{link.label}</span>
                        <span className="text-aqua-muted transition duration-300 group-hover:translate-x-0.5">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-14 max-w-xl text-center text-sm leading-relaxed text-charcoal/65">
            Crews, equipment, and checklists aligned to coastal substrates and access realities.
          </p>
        </section>
      </ScrollReveal>

      <section className="animate-fade-up py-16 md:py-24">
        <div className="grid min-w-0 gap-10 md:gap-14 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-navy/[0.08] shadow-lift sm:min-h-[300px] md:min-h-[380px] md:rounded-3xl">
            <Image
              src={MAINTENANCE_IMAGE}
              alt="Professional property maintenance"
              fill
              className="object-cover saturate-[0.95]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-navy-deep/40 via-transparent to-transparent"
              aria-hidden
            />
          </div>
          <div className="lg:pl-4">
            <h2 className="section-title">Who we work with</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-charcoal/75">
              From estate driveways to dealership glass lines—one operations mindset: quiet execution,
              written scope, and repeatability.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {WHO_WE_SERVE.map((label) => (
                <li
                  key={label}
                  className="min-w-0 rounded-xl border border-navy/[0.08] bg-white/80 px-3 py-3.5 text-center text-sm font-medium text-navy shadow-sm backdrop-blur-sm transition duration-300 hover:border-aqua/20 hover:shadow-card sm:px-4"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-navy via-navy to-navy-deep py-16 text-cream shadow-luxury md:rounded-3xl md:py-20">
        <div className="absolute inset-0 bg-luxury-radial opacity-60" aria-hidden />
        <div className="hero-grain absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-2 text-center">
          <h2 className="section-title text-cream">Local operations, county-wide</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/85 md:text-lg">
            {SITE_NAME} runs programs throughout West Palm Beach, Palm Beach Gardens, Jupiter, Riviera
            Beach, Lake Worth, Boynton Beach, Delray Beach, North Palm Beach, Juno Beach, and nearby Palm
            Beach County areas. Coastal humidity, salt exposure, and seasonal occupancy patterns inform
            how we schedule exterior refreshes, interior care, and turnovers.
          </p>
          <Link
            href="/service-area"
            className="mt-8 inline-block text-sm font-semibold tracking-wide text-aqua no-underline transition hover:text-cream"
          >
            View service area →
          </Link>
        </div>
      </section>

      <section className="animate-fade-up py-16 md:py-24">
        <h2 className="section-title">How it works</h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-charcoal/70 md:text-base">
          A clear path from first contact to completed scope—no ambiguity for owners or managers.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 md:mt-12 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step} className="luxury-card hover:-translate-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-aqua-muted">
                Step {i + 1}
              </span>
              <p className="mt-4 font-semibold leading-snug text-navy">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-band-muted">
        <div className="mx-auto max-w-3xl">
          <h2 className="section-title">Documentation &amp; trust</h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-charcoal/75">
            Larger exterior and commercial scopes can include photo checklists and walkthrough notes so
            owners and property managers retain a clear record—ask how documentation is handled for your
            asset class.
          </p>
        </div>
      </section>

      <section className="animate-fade-up py-16 md:py-20">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="section-title">FAQ</h2>
          <p className="mt-4 text-sm text-charcoal/65">Common questions from property owners and managers.</p>
          <div className="mt-10">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-charcoal to-navy-deep px-4 py-16 text-center text-cream shadow-luxury sm:px-8 md:rounded-3xl md:py-20">
        <div className="absolute inset-0 bg-luxury-vignette opacity-70" aria-hidden />
        <div className="hero-grain absolute inset-0 opacity-15" aria-hidden />
        <div className="relative">
          <h2 className="section-title text-cream">Ready when you are</h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-silver/90">
            Same team for quotes, service delivery, invoices, and reviews—organized like modern property
            operations should be.
          </p>
          <div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:gap-4">
            <Link href="/quote" className="btn-hero-primary min-h-[52px] w-full sm:w-auto">
              Get Free Quote
            </Link>
            <a href={PHONE_TEL} className="btn-hero-secondary min-h-[52px] w-full sm:w-auto">
              Call or Text {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
