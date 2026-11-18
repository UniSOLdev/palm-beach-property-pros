import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ClosingCta, SectionHeading } from "@/components/site/sections";
import { CATEGORIES, servicesIn } from "@/lib/site/catalog";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Private Quotes & Pricing",
  description:
    "Every Palm Beach Property Pros engagement is quoted privately: estate cleaning, exterior care, detailing, property maintenance, and home watch. Request a no-obligation quote.",
  alternates: { canonical: "/pricing" },
};

/** Kept for its URL/SEO history. Pricing is private: no figures are ever shown. */
export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Every engagement, quoted privately."
        lead="Pricing reflects your property, scope, access, and schedule, confirmed in writing before any work begins. No obligation, no surprises."
        image="/photos/pool-terrace.jpg"
        imageAlt="Pool terrace and glass pavilion in afternoon light"
      >
        <Link href="/quote" className="btn-gold">Request a private quote</Link>
        <a href={PHONE_TEL} className="btn-ghost-light">Call {PHONE_DISPLAY}</a>
      </PageHero>
      <section className="bg-cream py-20 sm:py-28">
        <div className="site-container">
          <Reveal>
            <SectionHeading eyebrow="How quotes work" title="Clear, written, and tailored." lead="Tell us what you need by phone or through our request form. We confirm scope, often with a short walk-through or photos, and send a written quote. Recurring plans are billed monthly; one-time projects on completion." />
          </Reveal>
          <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Reveal key={c.id}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-dark">{c.eyebrow}</h2>
                <ul className="mt-5 divide-y divide-navy/10 border-y border-navy/10">
                  {servicesIn(c.id).map((s) => (
                    <li key={s.slug} className="flex items-center justify-between gap-3 py-3">
                      <Link href={`/services/${s.slug}`} className="text-lg text-navy no-underline hover:text-brass-dark">{s.name}</Link>
                      <Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="shrink-0 text-sm font-semibold text-charcoal/70 underline underline-offset-4">Quote</Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <ClosingCta />
    </>
  );
}
