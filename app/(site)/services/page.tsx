import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ClosingCta, HowItWorksSection, SectionHeading, ServiceCard } from "@/components/site/sections";
import { CATEGORIES, servicesIn } from "@/lib/site/catalog";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services: Estate Cleaning, Exterior Care, Detailing & Home Watch",
  description:
    "Residential and estate cleaning, window cleaning, pressure washing, landscape maintenance, auto detailing, property maintenance, and private home watch across Palm Beach County. Private quotes only.",
  alternates: { canonical: "/services" },
};

const ORDER = ["interiors", "exteriors", "automotive", "private-client"] as const;

export default function ServicesPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]} />
      <PageHero
        eyebrow="Services"
        title="Every detail of your property, to one standard."
        lead="Book a single service or combine several into one plan. Every engagement is scoped and quoted privately."
        image="/photos/villa-pool-modern.jpg"
        imageAlt="Contemporary white villa with a pool under a blue sky"
      >
        <Link href="/quote" className="btn-gold">Request a private quote</Link>
        <a href={PHONE_TEL} className="btn-ghost-light">Call {PHONE_DISPLAY}</a>
      </PageHero>

      {ORDER.map((id, i) => {
        const c = CATEGORIES.find((x) => x.id === id)!;
        return (
          <section key={id} id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-24 py-20 sm:py-28 ${i % 2 ? "bg-cream-warm" : "bg-cream"}`}>
            <div className="site-container">
              <Reveal>
                <SectionHeading id={`${id}-title`} eyebrow={c.eyebrow} title={c.title} lead={c.lead} />
              </Reveal>
              <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {servicesIn(id).map((s, k) => (
                  <Reveal key={s.slug} delay={(k % 3) * 80}>
                    <ServiceCard service={s} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}
      <HowItWorksSection />
      <ClosingCta />
    </>
  );
}
