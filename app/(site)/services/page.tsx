import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { HowItWorksSection, QuoteSection, ServiceCard } from "@/components/site/sections";
import { SERVICES } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Services: Home Watch, Seasonal Prep, Hurricane Prep & More",
  description:
    "Home watch, arrival and departure prep, hurricane preparation, handyman help, vendor coordination, and concierge services for homes in Palm Beach Gardens, Jupiter, North Palm Beach, and Palm Beach. Private quotes only.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]} />
      <section className="bg-cream py-16 sm:py-20">
        <div className="site-container">
          <p className="eyebrow">Services</p>
          <h1 className="font-display mt-3 text-5xl font-medium leading-tight text-navy sm:text-6xl">
            Care for your home, whether you&apos;re here or away.
          </h1>
          <p className="lead-text mt-6 max-w-3xl">
            Choose one service or combine several into a single plan. Every plan is built around
            your home and your calendar, and every plan is quoted privately — by phone or by request.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </div>
      </section>
      <HowItWorksSection />
      <QuoteSection />
    </>
  );
}
