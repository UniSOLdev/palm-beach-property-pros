import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { CATEGORIES, servicesIn, type CatalogService, type CategoryId } from "@/lib/site/catalog";
import { FAQS, HOW_IT_WORKS, SERVICE_AREAS, TESTIMONIALS } from "@/lib/site/content";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

/** Sample testimonials are visible on previews only. They never ship to production. */
const IS_PRODUCTION = process.env.VERCEL_ENV === "production";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  align = "left",
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  id?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${dark ? "text-brass-light" : "text-brass-dark"}`}>{eyebrow}</p>
      <h2 id={id} className={`font-display mt-4 text-4xl font-medium leading-[1.08] sm:text-5xl lg:text-6xl ${dark ? "text-cream" : "text-navy"}`}>
        {title}
      </h2>
      {lead ? <p className={`mt-6 text-lg leading-relaxed sm:text-xl ${dark ? "text-cream/85" : "text-charcoal/80"}`}>{lead}</p> : null}
    </div>
  );
}

export function Intro() {
  const pillars = [
    { k: "01", title: "One team, every detail", body: "Interiors, grounds, hardscape, vehicles, and the home itself, coordinated by one accountable team." },
    { k: "02", title: "Discretion, always", body: "We never name clients or photograph homes for marketing. Keys are coded, never labeled." },
    { k: "03", title: "Documented standards", body: "Written checklists and dated photo documentation after every service." },
  ];
  return (
    <section aria-labelledby="intro-title" className="bg-cream py-24 sm:py-32">
      <div className="site-container">
        <Reveal>
          <SectionHeading
            id="intro-title"
            eyebrow="Palm Beach Property Pros"
            title="The standard of a private estate staff, without the staff."
            lead="From weekly estate cleaning and immaculate grounds to hand-finished detailing and home watch while you're away, we care for the homes of the Palm Beaches with the precision and quiet professionalism they deserve."
          />
        </Reveal>
        <div className="mt-16 grid gap-10 border-t border-navy/10 pt-12 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.k} delay={i * 90}>
              <p className="font-display text-2xl text-brass-dark">{p.k}</p>
              <h3 className="mt-3 text-xl font-semibold text-navy">{p.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-charcoal/80">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceList({ services, tone = "light" }: { services: CatalogService[]; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <ul className={`divide-y ${dark ? "divide-white/15 border-white/15" : "divide-navy/10 border-navy/10"} border-y`}>
      {services.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/services/${s.slug}`}
            className={`group flex min-h-[64px] items-center justify-between gap-4 py-4 text-lg no-underline sm:text-xl ${dark ? "text-cream" : "text-navy"}`}
          >
            <span className="transition-colors group-hover:text-brass-dark">{s.name}</span>
            <span aria-hidden="true" className={`text-2xl transition-transform group-hover:translate-x-1 ${dark ? "text-brass-light" : "text-brass-dark"}`}>
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CategoryFeature({ id, flip = false }: { id: CategoryId; flip?: boolean }) {
  const c = CATEGORIES.find((x) => x.id === id)!;
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <Reveal className={flip ? "lg:order-2" : ""}>
        <div className="img-zoom relative aspect-[4/5] overflow-hidden rounded-[28px] sm:aspect-[5/4] lg:aspect-[4/5]">
          <Image src={c.image} alt={c.imageAlt} fill sizes="(min-width: 1024px) 45vw, 100vw" quality={70} className="object-cover" />
        </div>
      </Reveal>
      <Reveal delay={120}>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-dark">{c.eyebrow}</p>
        <h3 className="font-display mt-4 text-4xl font-medium leading-tight text-navy sm:text-5xl">{c.title}</h3>
        <p className="mt-5 text-lg leading-relaxed text-charcoal/80">{c.lead}</p>
        <div className="mt-8">
          <ServiceList services={servicesIn(id)} />
        </div>
        <Link href={`/quote`} className="mt-8 inline-flex items-center gap-2 text-lg font-semibold text-navy underline decoration-brass underline-offset-8 hover:decoration-navy">
          Request a private quote
        </Link>
      </Reveal>
    </div>
  );
}

export function ServicesShowcase() {
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-20 bg-cream-warm py-24 sm:py-32">
      <div className="site-container">
        <Reveal>
          <SectionHeading
            id="services-title"
            eyebrow="Services"
            title="Everything your property needs, to one standard."
            lead="Book a single service or combine several into one plan. Every engagement is quoted privately."
          />
        </Reveal>
        <div className="mt-20 space-y-28">
          <CategoryFeature id="interiors" />
          <CategoryFeature id="exteriors" flip />
        </div>
      </div>
    </section>
  );
}

export function DetailingFeature() {
  const services = servicesIn("automotive");
  return (
    <section aria-labelledby="detailing-title" className="relative overflow-hidden bg-navy-deep text-cream">
      <div className="absolute inset-0">
        <Image src="/photos/detailing-hand-wash.jpg" alt="" fill sizes="100vw" quality={65} className="object-cover object-[70%_60%]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,26,46,0.94)_0%,rgba(8,26,46,0.72)_45%,rgba(8,26,46,0.15)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(8,26,46,0.55)_0%,rgba(8,26,46,0.92)_70%)]" />
      </div>
      <div className="site-container relative py-28 sm:py-40">
        <Reveal className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-light">Automotive</p>
          <h2 id="detailing-title" className="font-display mt-4 text-4xl font-medium leading-tight sm:text-6xl">
            Detailing, delivered to your driveway.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-cream/85 sm:text-xl">
            Hand washing, interior refresh, and show-ready finishes for daily drivers and collections, performed at your residence with care for every surface.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href={`/services/${services[0]?.slug ?? "auto-detailing"}`} className="btn-gold">
              Explore detailing
            </Link>
            <Link href="/quote?service=Auto%20Detailing" className="btn-ghost-light">
              Request a quote
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function PrivateClientSection() {
  const c = CATEGORIES.find((x) => x.id === "private-client")!;
  return (
    <section id="private-client" aria-labelledby="private-title" className="scroll-mt-20 bg-navy py-24 text-cream sm:py-32">
      <div className="site-container grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <Reveal>
          <SectionHeading
            id="private-title"
            tone="dark"
            eyebrow={c.eyebrow}
            title="While you're away, we're here."
            lead="For seasonal residents and frequent travelers: scheduled home watch with photo reports, arrival and departure preparation, hurricane readiness, and a single trusted point of contact for every vendor."
          />
          <div className="mt-10">
            <ServiceList services={servicesIn("private-client")} tone="dark" />
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={PHONE_TEL} className="btn-gold">
              Arrange a consultation
            </a>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="img-zoom relative aspect-[4/5] overflow-hidden rounded-[28px]">
            <Image src="/photos/hero-interior-arched.jpg" alt="Elegant interior with arched windows, prepared for arrival" fill sizes="(min-width: 1024px) 45vw, 100vw" quality={70} className="object-cover" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 bg-cream py-24 sm:py-32">
      <div className="site-container">
        <Reveal>
          <SectionHeading id="how-title" eyebrow="How it works" title="Effortless from the first call." />
        </Reveal>
        <ol className="mt-16 grid gap-12 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 100} className="border-t border-navy/15 pt-8">
              <div>
                <span className="font-display text-5xl text-brass-dark" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-navy">{step.title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-charcoal/80">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function TrustSection() {
  const quotes = TESTIMONIALS.filter((t) => !t.placeholder || !IS_PRODUCTION);
  const standards = [
    "Licensed & insured",
    "Background-checked team",
    "Written scope before work begins",
    "Dated photo documentation",
    "Coded keys, private codes",
    "References on request",
  ];
  return (
    <section id="trust" aria-labelledby="trust-title" className="scroll-mt-20 bg-cream-warm py-24 sm:py-32">
      <div className="site-container">
        <Reveal>
          <SectionHeading
            id="trust-title"
            eyebrow="Trusted across the Palm Beaches"
            title="Trusted by families across the Palm Beaches."
            lead="We never name our clients or photograph their homes. Discretion is the service."
          />
        </Reveal>
        {quotes.length ? (
          <ul className="mt-16 grid gap-6 lg:grid-cols-3">
            {quotes.map((t, i) => (
              <Reveal as="li" key={t.name} delay={i * 90} className="flex h-full flex-col rounded-[24px] bg-white p-8">
                  {t.placeholder ? (
                    <span className="mb-5 self-start rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-wide text-charcoal">
                      Sample · preview only
                    </span>
                  ) : null}
                  <figure className="flex flex-1 flex-col">
                    <blockquote className="font-display flex-1 text-2xl leading-snug text-navy">“{t.quote}”</blockquote>
                    <figcaption className="mt-6 text-base font-medium text-charcoal/70">
                      {t.name} · {t.area}
                    </figcaption>
                  </figure>
              </Reveal>
            ))}
          </ul>
        ) : null}
        <Reveal>
          <ul className="mt-14 grid grid-cols-1 gap-x-10 gap-y-4 border-t border-navy/10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {standards.map((s) => (
              <li key={s} className="flex items-center gap-3 text-lg text-navy">
                <span aria-hidden="true" className="h-px w-6 bg-brass-dark" />
                {s}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

export function ServiceAreaSection() {
  return (
    <section id="service-area" aria-labelledby="area-title" className="relative overflow-hidden bg-navy-deep py-24 text-cream sm:py-32">
      <div className="absolute inset-0 opacity-30">
        <Image src="/photos/palms-sky.jpg" alt="" fill sizes="100vw" quality={55} className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-navy-deep/70" />
      <div className="site-container relative">
        <Reveal>
          <SectionHeading
            id="area-title"
            tone="dark"
            eyebrow="Service area"
            title="Local to the Palm Beaches."
            lead="Close enough to be at your door quickly, before a storm, after one, or whenever something needs attention."
          />
        </Reveal>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-[24px] bg-white/15 sm:grid-cols-2">
          {SERVICE_AREAS.map((a) => (
            <li key={a.slug} className="bg-navy-deep/80 p-8 backdrop-blur-sm">
              <h3 className="font-display text-3xl">{a.name}</h3>
              <p className="mt-2 text-lg leading-relaxed text-cream/80">{a.blurb}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-lg text-cream/85">
          Cleaning, exterior, and detailing services also cover West Palm Beach, Juno Beach, and greater Palm Beach County.{" "}
          <Link href="/service-area" className="font-semibold text-brass-light underline underline-offset-4">
            See all areas
          </Link>
        </p>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 bg-cream py-24 sm:py-32">
      <div className="site-container grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <SectionHeading id="faq-title" eyebrow="Questions" title="What clients ask." />
          <p className="mt-6 text-lg text-charcoal/80">
            Something else?{" "}
            <a href={PHONE_TEL} className="font-semibold text-navy underline underline-offset-4">
              {PHONE_DISPLAY}
            </a>
          </p>
        </Reveal>
        <div className="divide-y divide-navy/10 border-y border-navy/10">
          {FAQS.map((f) => (
            <details key={f.question} className="group">
              <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-6 py-5 text-xl font-medium text-navy [&::-webkit-details-marker]:hidden">
                {f.question}
                <span aria-hidden="true" className="text-3xl font-light text-brass-dark transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-6 pr-10 text-lg leading-relaxed text-charcoal/80">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-navy-deep text-cream">
      <div className="absolute inset-0">
        <Image src="/photos/estate-pool-white.jpg" alt="" fill sizes="100vw" quality={65} className="object-cover" />
        <div className="absolute inset-0 bg-navy-deep/65" />
      </div>
      <div className="site-container relative py-28 text-center sm:py-40">
        <Reveal>
          <h2 id="cta-title" className="font-display mx-auto max-w-3xl text-4xl font-medium leading-tight sm:text-6xl">
            Let&apos;s talk about your property.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-cream/85 sm:text-xl">A private, no-obligation quote, by phone or by request.</p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/quote" className="btn-gold">
              Request a private quote
            </Link>
            <a href={PHONE_TEL} className="btn-ghost-light">
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Card used on /services and related lists. */
export function ServiceCard({ service }: { service: CatalogService }) {
  return (
    <Link href={`/services/${service.slug}`} className="group block no-underline">
      <div className="img-zoom relative aspect-[4/3] overflow-hidden rounded-[22px] bg-sand">
        <Image src={service.image} alt={service.imageAlt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" quality={65} className="object-cover" />
        {service.premium ? (
          <span className="absolute left-4 top-4 rounded-full bg-navy-deep/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-brass-light backdrop-blur">
            Private client
          </span>
        ) : null}
      </div>
      <h3 className="font-display mt-5 text-3xl text-navy group-hover:text-brass-dark">{service.name}</h3>
      <p className="mt-2 text-lg leading-relaxed text-charcoal/80">{service.summary}</p>
      <span className="mt-4 inline-block text-base font-semibold text-navy underline decoration-brass underline-offset-8">View service</span>
    </Link>
  );
}
