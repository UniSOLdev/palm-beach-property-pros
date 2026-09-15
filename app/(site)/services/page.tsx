import type { Metadata } from "next";
import Link from "next/link";
import { CORE_SERVICES } from "@/lib/marketing/core-services";
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
      <section className="mx-auto max-w-3xl px-6 py-14 text-center md:py-20">
        <p className="section-eyebrow text-ocean">Services</p>
        <h1 className="section-title mt-3">Restoration, cleaning & maintenance</h1>
        <p className="section-lead mt-4">
          Residential and commercial field work — yards, glass, turnovers, and cleanouts. No
          carpentry. Request a quote and we confirm scope before crews dispatch.
        </p>
        <Link href={QUOTE_PATH} className="btn-primary mt-8 inline-flex min-h-[48px] px-8">
          Get a free quote
        </Link>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_SERVICES.map((core) => {
            const s = PUBLIC_SERVICES.find((item) => item.slug === core.slug);
            if (!s) return null;
            return (
              <article
                key={s.slug}
                className="flex flex-col rounded-2xl border border-navy/[0.08] bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-navy">{core.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal/75">{core.tagline}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/services/${s.slug}`} className="text-sm font-semibold text-ocean no-underline hover:underline">
                    Learn more
                  </Link>
                  <span className="text-charcoal/30">·</span>
                  <Link
                    href={`${QUOTE_PATH}?service=${encodeURIComponent(s.name)}`}
                    className="text-sm font-semibold text-ocean no-underline hover:underline"
                  >
                    Get quote
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {MORE_SERVICES.length > 0 ? (
        <section className="mx-auto max-w-3xl px-6 pb-16 md:pb-20">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-charcoal/50">
            Also available
          </h2>
          <ul className="mt-6 divide-y divide-navy/[0.08] rounded-2xl border border-navy/[0.08] bg-white">
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
