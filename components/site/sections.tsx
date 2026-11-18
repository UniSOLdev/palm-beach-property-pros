import Image from "next/image";
import Link from "next/link";
import { QuoteForm } from "@/components/site/quote-form";
import { DETAIL_PHOTOS } from "@/lib/site/details";
import { FAQS, HOW_IT_WORKS, SERVICE_AREAS, SERVICES, TESTIMONIALS, type Service } from "@/lib/site/content";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  center = false,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  id?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="h2-display mt-3">
        {title}
      </h2>
      {lead ? <p className="lead-text mt-5">{lead}</p> : null}
    </div>
  );
}

export function PromiseBand() {
  const points = [
    { title: "Discretion", body: "Your name, address, and routines stay private. Always." },
    { title: "Responsiveness", body: "One person to call, who answers — and calls you back the same day." },
    { title: "Documentation", body: "A dated photo report after every visit, so you never have to wonder." },
  ];
  return (
    <section aria-labelledby="promise-title" className="bg-cream py-20 sm:py-24">
      <div className="site-container">
        <SectionHeading
          id="promise-title"
          eyebrow="Palm Beach Property Pros"
          title="One trusted person. One phone call."
          lead="For families who live here part of the year, a home in South Florida needs someone local who notices things. We look after your home as if it were our own — and we keep you informed without making you manage anything."
        />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {points.map((p) => (
            <li key={p.title} className="border-t-2 border-brass pt-5">
              <h3 className="font-display text-3xl text-navy">{p.title}</h3>
              <p className="mt-2 text-lg leading-relaxed text-charcoal/90">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-navy/10 bg-white p-7 shadow-card">
      <h3 className="font-display text-3xl text-navy">
        <Link href={`/services/${service.slug}`} className="no-underline hover:underline">
          {service.name}
        </Link>
      </h3>
      <p className="mt-3 flex-1 text-lg leading-relaxed text-charcoal/90">{service.summary}</p>
      <div className="mt-6 flex flex-col gap-3">
        <a href={PHONE_TEL} className="btn-navy w-full !text-base">
          Call for a private quote
        </a>
        <Link
          href={`/quote?service=${encodeURIComponent(service.name)}`}
          className="btn-ghost-dark w-full !text-base"
        >
          Request a quote
        </Link>
      </div>
    </article>
  );
}

export function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-title" className="bg-cream-warm py-20 sm:py-24">
      <div className="site-container">
        <SectionHeading
          id="services-title"
          eyebrow="Services"
          title="Everything your home needs, handled quietly."
          lead="Choose one service or combine several into a single plan for your home. Every plan is quoted privately."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 bg-navy py-20 text-cream sm:py-24">
      <div className="site-container">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass-light">How it works</p>
        <h2 id="how-title" className="font-display mt-3 text-4xl font-medium leading-tight sm:text-5xl">
          Simple from the first call.
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title}>
              <span className="font-display text-6xl text-brass-light" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-2xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-cream/90">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <a href={PHONE_TEL} className="btn-gold">
            Start with a call: {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  return (
    <section id="trust" aria-labelledby="trust-title" className="bg-cream py-20 sm:py-24">
      <div className="site-container">
        <SectionHeading
          id="trust-title"
          eyebrow="References available on request"
          title="Trusted by families across the Palm Beaches."
          lead="We never name our clients or show their homes. These are the details we care about."
        />
        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li key={t.name} className="rounded-3xl bg-white p-7 shadow-card">
              {t.placeholder ? (
                <span className="mb-4 inline-block rounded-full bg-sand px-3 py-1 text-xs font-semibold uppercase tracking-wide text-charcoal">
                  Sample
                </span>
              ) : null}
              <figure>
                <blockquote className="font-display text-2xl leading-snug text-navy">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 text-base font-semibold text-charcoal/80">
                  {t.name} · {t.area}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <ul className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {DETAIL_PHOTOS.map((p) => (
            <li key={p.src}>
              <figure>
                <div className="relative overflow-hidden rounded-2xl bg-sand">
                  <Image
                    src={p.src}
                    alt={p.alt}
                    width={480}
                    height={600}
                    sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
                    className="h-auto w-full"
                  />
                  {p.placeholder ? (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-charcoal">
                      Placeholder
                    </span>
                  ) : null}
                </div>
                <figcaption className="mt-2 text-base leading-snug text-charcoal/85">{p.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ServiceAreaSection() {
  return (
    <section id="service-area" aria-labelledby="area-title" className="bg-cream-warm py-20 sm:py-24">
      <div className="site-container">
        <SectionHeading
          id="area-title"
          eyebrow="Service area"
          title="Local to the northern Palm Beaches."
          lead="We keep our area small on purpose, so we can be at your door quickly — before a storm, after one, or whenever something needs attention."
        />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {SERVICE_AREAS.map((a) => (
            <li key={a.slug} className="rounded-3xl border border-navy/10 bg-white p-7">
              <h3 className="font-display text-3xl text-navy">{a.name}</h3>
              <p className="mt-2 text-lg leading-relaxed text-charcoal/90">{a.blurb}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-lg text-charcoal/90">
          Nearby but not listed?{" "}
          <a href={PHONE_TEL} className="font-semibold text-navy underline">
            Call and ask
          </a>{" "}
          — we often can.
        </p>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 bg-cream py-20 sm:py-24">
      <div className="site-container">
        <SectionHeading id="faq-title" eyebrow="Questions" title="What clients usually ask." />
        <div className="mt-10 divide-y divide-navy/10 rounded-3xl border border-navy/10 bg-white">
          {FAQS.map((f, i) => (
            <details key={f.question} className="group px-6 py-2 sm:px-8" open={i === 0}>
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-xl font-semibold text-navy [&::-webkit-details-marker]:hidden">
                {f.question}
                <span aria-hidden="true" className="text-3xl font-normal text-brass-dark transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-lg leading-relaxed text-charcoal/90">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function QuoteSection({ defaultService }: { defaultService?: string }) {
  return (
    <section id="quote" aria-labelledby="quote-title" className="scroll-mt-20 bg-cream-warm py-20 sm:py-24">
      <div className="site-container grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="eyebrow">Private quote</p>
          <h2 id="quote-title" className="h2-display mt-3">
            Let&apos;s talk about your home.
          </h2>
          <p className="lead-text mt-5">
            Every home is different, so we quote privately. Tell us a little about yours and
            when to call — or simply pick up the phone.
          </p>
          <a href={PHONE_TEL} className="btn-navy mt-8">
            Call {PHONE_DISPLAY}
          </a>
          <ul className="mt-10 space-y-3 text-lg text-charcoal/90">
            <li>✓ No obligation, no pressure</li>
            <li>✓ A personal call back, usually within one business day</li>
            <li>✓ Your details are never shared</li>
          </ul>
        </div>
        <QuoteForm defaultService={defaultService} idPrefix="home" />
      </div>
    </section>
  );
}
