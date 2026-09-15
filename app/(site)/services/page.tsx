import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import { ServiceMediaCard } from "@/components/marketing/service-media-card";
import { CORE_SERVICES } from "@/lib/marketing/core-services";
import { getSiteHeroFallback, getServiceImageAsset } from "@/lib/marketing/service-images";
import { PUBLIC_SERVICES } from "@/lib/services";
import { QUOTE_PATH, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Yard, Cleaning & Property Services",
  description: `${SITE_NAME} — Property restoration, cleaning, and maintenance for residential and commercial clients in Palm Beach County. No carpentry.`,
};

const CORE_SLUGS = new Set(CORE_SERVICES.map((c) => c.slug));
const MORE_SERVICES = PUBLIC_SERVICES.filter((s) => !CORE_SLUGS.has(s.slug));

export default function ServicesPage() {
  return (
    <div className="bg-cream">
      <MarketingPageHero
        eyebrow="Services"
        title="Restoration, cleaning & maintenance"
        lead="Residential and commercial field work — yards, glass, turnovers, and cleanouts. No carpentry. Request a quote and we confirm scope before crews dispatch."
        image={getSiteHeroFallback()}
        cta={{ href: QUOTE_PATH, label: "Get a free quote" }}
      />

      <section className="mx-auto max-w-6xl px-2 pb-12 md:pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:gap-6">
          {CORE_SERVICES.map((core) => {
            const s = PUBLIC_SERVICES.find((item) => item.slug === core.slug);
            if (!s) return null;
            return (
              <ServiceMediaCard
                key={s.slug}
                href={`/services/${s.slug}`}
                title={core.name}
                description={core.tagline}
                asset={getServiceImageAsset(s.slug)}
              />
            );
          })}
        </div>
      </section>

      {MORE_SERVICES.length > 0 ? (
        <section className="section-band-light mx-auto max-w-3xl px-2 pb-16 md:pb-20">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-charcoal/50">
            Also available
          </h2>
          <ul className="mt-6 divide-y divide-navy/[0.08] overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-sm">
            {MORE_SERVICES.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 text-sm no-underline transition hover:bg-cream/80"
                >
                  <span className="font-medium text-navy">{s.name}</span>
                  <span className="shrink-0 text-ocean">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
