import type { Metadata } from "next";
import Link from "next/link";
import { PbppCtaLink } from "@/components/pbpp-cta-link";
import { getPublishedSeoForKey } from "@/lib/cms-queries";
import { CTA_LABELS, PBPP_ROUTES } from "@/lib/cta-routes";
import { SERVICES } from "@/lib/services";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublishedSeoForKey("services_index");
  return {
    title: seo?.title ?? "Cleaning & Property Services",
    description:
      seo?.description ??
      `${SITE_NAME} — window cleaning, hospitality programs, move-in/move-out support, residential and commercial cleaning, detailing, and property care in Palm Beach County. Licensed & insured.`,
  };
}

export default function ServicesPage() {
  return (
    <div className="bg-cream">
      <section className="w-full py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Services</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
          One local team for cleaning, detailing, and property care
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-charcoal/85">
          Browse services by property type, then request pricing or open your client tools—all on the
          Palm Beach Property Pros platform.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PbppCtaLink href={PBPP_ROUTES.quote} className="btn-primary">
            {CTA_LABELS.getAFreeQuote}
          </PbppCtaLink>
          <PbppCtaLink href={PBPP_ROUTES.clientPortal} className="btn-secondary border-ocean/40">
            {CTA_LABELS.openClientPortal}
          </PbppCtaLink>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <article
              key={s.slug}
              id={s.anchor}
              className="scroll-mt-28 rounded-3xl border border-navy/10 bg-white p-6 shadow-card"
            >
              <h2 className="text-xl font-bold text-navy">{s.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{s.shortDescription}</p>
              <p className="mt-3 text-sm font-medium text-ocean">Best for</p>
              <p className="text-sm text-charcoal/85">{s.bestFor}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/services/${s.slug}`}
                  className="btn-primary px-4 py-2 text-xs sm:text-sm"
                >
                  Learn more
                </Link>
                <PbppCtaLink href={PBPP_ROUTES.quote} className="btn-secondary px-4 py-2 text-xs sm:text-sm">
                  {CTA_LABELS.requestPricing}
                </PbppCtaLink>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
