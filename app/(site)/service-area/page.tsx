import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ClosingCta, SectionHeading } from "@/components/site/sections";
import { SERVICE_AREAS } from "@/lib/site/content";
import { PHONE_DISPLAY, PHONE_TEL, SERVICE_CITIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Area: Palm Beach, Palm Beach Gardens, Jupiter & Palm Beach County",
  description:
    "Luxury property care across Palm Beach County: Palm Beach, Palm Beach Gardens, Jupiter, North Palm Beach, West Palm Beach, Juno Beach, and nearby communities. Cleaning, exterior care, detailing, and home watch.",
  alternates: { canonical: "/service-area" },
};

export default function ServiceAreaPage() {
  const county = SERVICE_CITIES.filter((c) => !c.startsWith("and ") && !SERVICE_AREAS.some((a) => a.name === c));
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Service area", path: "/service-area" }]} />
      <PageHero
        eyebrow="Service area"
        title="Local to the Palm Beaches."
        lead="Close enough to be at your door quickly, before a storm, after one, or whenever something needs attention."
        image="/photos/palms-sky.jpg"
        imageAlt="Palm trees against a coastal sky"
      />
      <section className="bg-cream py-20 sm:py-28">
        <div className="site-container">
          <Reveal>
            <SectionHeading eyebrow="Signature communities" title="All services, including private client care." />
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {SERVICE_AREAS.map((a) => (
              <Reveal key={a.slug}>
                <section id={a.slug} aria-labelledby={`${a.slug}-t`} className="scroll-mt-24 h-full rounded-[24px] bg-white p-8 sm:p-10">
                  <h2 id={`${a.slug}-t`} className="font-display text-4xl text-navy">{a.name}</h2>
                  <p className="mt-3 text-lg leading-relaxed text-charcoal/80">{a.blurb}</p>
                  <p className="mt-4 text-base text-charcoal/70">Estate cleaning · exterior care · detailing · home watch · concierge</p>
                </section>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <h2 className="mt-20 text-xs font-semibold uppercase tracking-[0.3em] text-brass-dark">Across Palm Beach County</h2>
            <p className="font-display mt-4 max-w-3xl text-3xl leading-snug text-navy">
              Cleaning, exterior, maintenance, and detailing services also serve {county.join(", ")}, and nearby communities.
            </p>
            <p className="mt-6 text-lg text-charcoal/80">
              Not sure we cover your address?{" "}
              <a href={PHONE_TEL} className="font-semibold text-navy underline underline-offset-4">Call {PHONE_DISPLAY}</a> or{" "}
              <Link href="/quote" className="font-semibold text-navy underline underline-offset-4">send a request</Link>.
            </p>
          </Reveal>
        </div>
      </section>
      <ClosingCta />
    </>
  );
}
