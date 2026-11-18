import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { QuoteSection } from "@/components/site/sections";
import { SERVICE_AREAS, SERVICES } from "@/lib/site/content";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Area: Palm Beach Gardens, Jupiter, North Palm Beach & Palm Beach",
  description:
    "Home watch and household services for seasonal residents in Palm Beach Gardens, Jupiter, North Palm Beach, and Palm Beach, Florida. Call for a private quote.",
  alternates: { canonical: "/service-area" },
};

export default function ServiceAreaPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Service area", path: "/service-area" }]} />
      <section className="bg-cream py-16 sm:py-20">
        <div className="site-container">
          <p className="eyebrow">Service area</p>
          <h1 className="font-display mt-3 text-5xl font-medium leading-tight text-navy sm:text-6xl">
            Home watch across the northern Palm Beaches.
          </h1>
          <p className="lead-text mt-6 max-w-3xl">
            We keep our service area small on purpose. Being close means we can be at your home
            quickly — before a storm, after one, or whenever something needs attention.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {SERVICE_AREAS.map((a) => (
              <section key={a.slug} id={a.slug} aria-labelledby={`${a.slug}-title`} className="scroll-mt-24 rounded-3xl border border-navy/10 bg-white p-8">
                <h2 id={`${a.slug}-title`} className="font-display text-4xl text-navy">
                  {a.name}
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-charcoal/90">{a.blurb}</p>
                <p className="mt-4 text-lg leading-relaxed text-charcoal/90">
                  Services in {a.name}: {SERVICES.map((s) => s.name.toLowerCase()).join(", ")}.
                </p>
              </section>
            ))}
          </div>
          <p className="mt-10 text-lg text-charcoal/90">
            Close by but not listed? Call{" "}
            <a href={PHONE_TEL} className="font-semibold text-navy underline">
              {PHONE_DISPLAY}
            </a>{" "}
            — we can often help.
          </p>
        </div>
      </section>
      <QuoteSection />
    </>
  );
}
