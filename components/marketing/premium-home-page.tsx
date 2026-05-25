import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { HeroBackground } from "@/components/marketing/hero-background";
import { LuxuryImage } from "@/components/marketing/luxury-image";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { FAQ_ITEMS } from "@/lib/faq";
import { HOME_IMAGES } from "@/lib/marketing-images";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

const IMAGES = HOME_IMAGES;

const HERO_CHIPS = [
  "Licensed & insured",
  "Residential & commercial",
  "Airbnb & turnover specialists",
  "Palm Beach County based",
] as const;

const TRUST_SIGNALS = [
  { value: "4.9", label: "Client satisfaction focus" },
  { value: "County-wide", label: "Palm Beach operations" },
  { value: "Photo scope", label: "Documented field visits" },
] as const;

const TRUST_REVIEWS = [
  {
    quote:
      "Consistent crews, clear scope, and the kind of quiet execution you want for a second home.",
    attribution: "Seasonal homeowner · Palm Beach Gardens",
  },
  {
    quote:
      "Turnovers run on our checklist—not generic cleaning. Glass and exterior detail actually hold up.",
    attribution: "Short-term rental manager · Jupiter",
  },
] as const;

const CARE_PLANS = [
  {
    eyebrow: "Weekly rhythm",
    title: "Weekly care",
    body: "High-touch homes and active storefronts that need a steady baseline year-round.",
    icon: "calendar",
  },
  {
    eyebrow: "Seasonal playbook",
    title: "Seasonal property plans",
    body: "Open, close, and peak-season refreshes for coastal estates and second homes.",
    icon: "palm",
  },
  {
    eyebrow: "Owner-offsite coverage",
    title: "Vacation home care",
    body: "Coordinated visits while you are away—glass, exterior, and interior touchpoints.",
    icon: "estate",
  },
  {
    eyebrow: "Per turnover",
    title: "Airbnb turnover programs",
    body: "Check-in aligned crews, linen resets, and staging details under your SOPs.",
    icon: "key",
  },
  {
    eyebrow: "Commercial cadence",
    title: "Storefront maintenance plans",
    body: "Glass, floors, and high-traffic zones matched to operating hours and traffic.",
    icon: "storefront",
  },
] as const;

const SERVICE_LINES = [
  {
    title: "Exterior care",
    body: "Curb presence, glass clarity, and exterior surfaces maintained to coastal standards.",
    image: IMAGES.exterior,
    imageAlt: "Luxury coastal home exterior with pristine curb presence",
    focal: "object-[center_40%]",
    links: [
      { href: "/services/window-cleaning", label: "Window cleaning" },
      { href: "/services/pressure-washing", label: "Pressure washing" },
      { href: "/services/auto-detailing", label: "Exterior detailing" },
    ],
  },
  {
    title: "Interior care",
    body: "Residences and interiors kept inspection-ready with repeatable crew standards.",
    image: IMAGES.interior,
    imageAlt: "Luxury modern interior with refined finishes",
    focal: "object-center",
    links: [
      { href: "/services/residential-cleaning", label: "Residential cleaning" },
      { href: "/services/carpet-steam-cleaning", label: "Carpet cleaning" },
      { href: "/services/residential-cleaning", label: "Move-out cleaning" },
    ],
  },
  {
    title: "Property support",
    body: "Turnovers, light maintenance, and onsite support aligned with operations calendars.",
    image: IMAGES.propertySupport,
    imageAlt: "Professional equipment and operational field readiness",
    focal: "object-[center_45%]",
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

function PlanIcon({ type }: { type: (typeof CARE_PLANS)[number]["icon"] }) {
  const shared = "h-5 w-5 text-aqua";
  switch (type) {
    case "calendar":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M6 5h12a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
      );
    case "palm":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 8c-2 2-4 5-4 8M16 8c2 2 4 5 4 8M5 12h14" />
        </svg>
      );
    case "estate":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V21H3v-10.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-6h6v6" />
        </svg>
      );
    case "key":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 7.5a4.5 4.5 0 11-6.4 6.4L5 18l-2 2 2-2 4.1-4.1A4.5 4.5 0 0115.5 7.5z" />
        </svg>
      );
    case "storefront":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16l-1 10H5L4 10zM4 10l2-6h12l2 6M9 14h6" />
        </svg>
      );
  }
}

export function PremiumHomePage() {
  return (
    <>
      <section className="hero-cinematic animate-fade-up relative -mx-4 sm:-mx-6 md:mx-0 md:rounded-3xl">
        <HeroBackground src={IMAGES.hero} alt="Luxury Palm Beach estate exterior at dusk" />

        <div className="relative z-10 px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-32 lg:py-36">
          <div className="max-w-xl md:max-w-3xl">
            <p className="section-eyebrow text-aqua/90 md:tracking-[0.32em]">
              Premium Property Operations
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-cream drop-shadow-[0_2px_24px_rgba(8,26,46,0.45)] sm:text-5xl md:mt-7 md:text-[3.25rem] md:leading-[1.06]">
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
        <section className="section-band-light relative overflow-hidden">
          <div className="absolute inset-0 bg-luxury-mesh opacity-60" aria-hidden />
          <div className="relative mx-auto max-w-2xl text-center">
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
        <section className="relative py-16 md:py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/15 to-transparent" aria-hidden />
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Property care plans</p>
            <h2 className="section-title mt-4">Recurring programs, luxury cadence</h2>
            <p className="section-lead">
              Predictable visits, documented scope, and crews aligned to how your property actually
              runs—not generic &quot;recurring cleanings.&quot;
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {CARE_PLANS.map((plan, i) => (
              <article
                key={plan.title}
                className="care-plan-card group flex flex-col"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="care-plan-icon-wrap">
                  <PlanIcon type={plan.icon} />
                </div>
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
        <section className="section-band-warm relative overflow-hidden">
          <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-aqua/[0.04] blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-ocean">Divisions</p>
            <h2 className="section-title mt-4">Organized service lines</h2>
            <p className="section-lead">
              Exterior, interior, and property support—structured the way high-trust operators run field
              programs.
            </p>
          </div>
          <div className="relative mt-14 grid gap-10 md:gap-12 lg:grid-cols-3">
            {SERVICE_LINES.map((line) => (
              <div key={line.title} className="service-division group flex flex-col">
                <div className="service-division-image relative mb-8 aspect-[4/3] overflow-hidden rounded-2xl border border-navy/[0.08] shadow-card md:rounded-3xl">
                  <LuxuryImage
                    src={line.image}
                    alt={line.imageAlt}
                    fill
                    loading="lazy"
                    overlay="card"
                    hoverScale
                    className={`object-cover ${line.focal}`}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 z-[3] p-5">
                    <span className="inline-flex rounded-full border border-white/20 bg-navy-deep/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cream/90 backdrop-blur-md">
                      {line.title}
                    </span>
                  </div>
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-charcoal/70">{line.body}</p>
                <ul className="mt-6 space-y-3">
                  {line.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="service-link-card group/link">
                        <span>{link.label}</span>
                        <span className="text-aqua-muted transition duration-500 group-hover/link:translate-x-0.5">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="relative mx-auto mt-14 max-w-xl text-center text-sm leading-relaxed text-charcoal/65">
            Crews, equipment, and checklists aligned to coastal substrates and access realities.
          </p>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="py-16 md:py-24">
          <div className="grid min-w-0 gap-10 md:gap-14 lg:grid-cols-2 lg:items-center">
            <div className="image-frame relative min-h-[220px] overflow-hidden sm:min-h-[280px] md:min-h-[380px]">
              <LuxuryImage
                src={IMAGES.operations}
                alt="Estate driveway and luxury property exterior"
                fill
                loading="lazy"
                overlay="subtle"
                hoverScale
                className="object-cover object-[center_35%]"
                sizes="(max-width: 1024px) 100vw, 50vw"
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
                  <li key={label} className="audience-chip">
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <section className="trust-band relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-navy via-navy to-navy-deep py-14 text-cream shadow-luxury md:rounded-3xl md:py-16">
          <div className="absolute inset-0 bg-luxury-radial opacity-60" aria-hidden />
          <div className="hero-grain absolute inset-0 opacity-20" aria-hidden />
          <div className="relative">
            <div className="mx-auto max-w-2xl px-2 text-center">
              <p className="section-eyebrow text-aqua/80">Trusted locally</p>
              <h2 className="section-title mt-3 text-cream">Operational confidence, understated</h2>
            </div>
            <ul className="mx-auto mt-10 grid max-w-3xl gap-4 px-2 sm:grid-cols-3">
              {TRUST_SIGNALS.map((signal) => (
                <li key={signal.label} className="trust-metric">
                  <span className="trust-metric-value">{signal.value}</span>
                  <span className="trust-metric-label">{signal.label}</span>
                </li>
              ))}
            </ul>
            <div className="mx-auto mt-10 grid max-w-4xl gap-5 px-2 md:grid-cols-2">
              {TRUST_REVIEWS.map((review) => (
                <blockquote key={review.attribution} className="trust-quote">
                  <p className="text-sm leading-relaxed text-cream/90">&ldquo;{review.quote}&rdquo;</p>
                  <footer className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-silver/70">
                    {review.attribution}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-navy via-navy to-navy-deep py-16 text-cream shadow-luxury md:rounded-3xl md:py-20">
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
              className="mt-8 inline-block text-sm font-semibold tracking-wide text-aqua no-underline transition duration-500 hover:text-cream"
            >
              View service area →
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={60}>
        <section className="py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,280px)] lg:items-start lg:gap-14">
            <div>
              <h2 className="section-title">How it works</h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-charcoal/70 md:text-base">
                A clear path from first contact to completed scope—no ambiguity for owners or managers.
              </p>
              <ol className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2">
                {HOW_IT_WORKS.map((step, i) => (
                  <li key={step} className="luxury-card hover:-translate-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-aqua-muted">
                      Step {i + 1}
                    </span>
                    <p className="mt-4 font-semibold leading-snug text-navy">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="image-frame relative hidden aspect-[3/4] min-h-[280px] overflow-hidden lg:block">
              <LuxuryImage
                src={IMAGES.pressureWash}
                alt="Professional exterior surface care in progress"
                fill
                loading="lazy"
                overlay="card"
                hoverScale
                className="object-cover object-center"
                sizes="280px"
              />
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="section-band-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-luxury-mesh opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-3xl">
            <h2 className="section-title">Documentation &amp; trust</h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-charcoal/75">
              Larger exterior and commercial scopes can include photo checklists and walkthrough notes so
              owners and property managers retain a clear record—ask how documentation is handled for your
              asset class.
            </p>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="section-title">FAQ</h2>
            <p className="mt-4 text-sm text-charcoal/65">Common questions from property owners and managers.</p>
            <div className="mt-10">
              <FaqAccordion items={FAQ_ITEMS} />
            </div>
          </div>
        </section>
      </ScrollReveal>

      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-charcoal to-navy-deep px-4 py-16 text-center text-cream shadow-luxury sm:px-8 md:rounded-3xl md:py-20">
        <div className="absolute inset-0 bg-luxury-vignette opacity-70" aria-hidden />
        <div className="hero-grain absolute inset-0 opacity-15" aria-hidden />
        <div className="hero-glow absolute inset-0 opacity-40" aria-hidden />
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
