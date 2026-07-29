import type { Metadata } from "next";
import Link from "next/link";
import { SERVICES } from "@/lib/services";
import { getServicePublicHref } from "@/lib/service-pages";
import { CTA } from "@/lib/cta";
import { QUOTE_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cleaning & Property Services",
  description: `${SITE_NAME} — window cleaning, pressure washing, residential and commercial cleaning, property care, and mobile detailing in Palm Beach County.`,
  alternates: { canonical: `${SITE_URL}/services` },
};

export default function ServicesPage() {
  return (
    <div className="bg-cream">
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ocean">Services</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
            One local team for cleaning, property care, and mobile detailing
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal/85">
            Browse services by property type, then request a free estimate. We serve homeowners,
            property managers, and businesses throughout Palm Beach County.
          </p>
          <div className="mt-8">
            <Link href={QUOTE_PATH} className="btn-primary">
              {CTA.primaryEstimate}
            </Link>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <article
                key={s.slug}
                id={s.anchor}
                className="scroll-mt-28 rounded-xl border border-navy/10 bg-white p-6 shadow-md transition duration-200 hover:shadow-lg"
              >
                <h2 className="text-xl font-bold text-navy">{s.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{s.shortDescription}</p>
                <p className="mt-3 text-sm font-medium text-ocean">Best for</p>
                <p className="text-sm text-charcoal/85">{s.bestFor}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={getServicePublicHref(s.slug)}
                    className="btn-primary px-4 py-2 text-xs sm:text-sm"
                  >
                    Learn more
                  </Link>
                  <Link
                    href={`${QUOTE_PATH}?service=${encodeURIComponent(s.name)}`}
                    className="btn-secondary px-4 py-2 text-xs sm:text-sm"
                  >
                    {CTA.requestEstimate}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
