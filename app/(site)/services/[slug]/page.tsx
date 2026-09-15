import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeroImage } from "@/components/marketing/page-hero-image";
import { serviceLocationSeoParagraphs } from "@/lib/location-seo";
import { getServiceImageAsset } from "@/lib/marketing/service-images";
import {
  getPublicServiceBySlug,
  getRelatedServices,
  PUBLIC_SERVICES,
  type ServiceSlug,
} from "@/lib/services";
import { DEFAULT_SERVICE_PROCESS, SERVICE_TRUST_BULLETS } from "@/lib/service-trust";
import { QUOTE_PATH, SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PUBLIC_SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getPublicServiceBySlug(slug);
  if (!s) return {};
  return {
    title: `${s.name} | Palm Beach County`,
    description: `${s.shortDescription} Licensed & insured. Request scope via our online quote form.`,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const s = getPublicServiceBySlug(slug);
  if (!s) notFound();

  const processSteps = s.process ?? DEFAULT_SERVICE_PROCESS;
  const locationParagraphs = serviceLocationSeoParagraphs(s.name);
  const related = getRelatedServices(s.slug as ServiceSlug, 3);
  const quoteHref = `${QUOTE_PATH}?service=${encodeURIComponent(s.name)}`;
  const heroAsset = getServiceImageAsset(s.slug as ServiceSlug);

  return (
    <div className="bg-cream">
      <article className="mx-auto w-full max-w-6xl px-2 py-8 md:py-12">
        <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
          ← All services
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-10">
          <div>
            <p className="section-eyebrow text-ocean">{s.name}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              {s.headline}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-charcoal/90">{s.authorityIntro}</p>
            <Link href={quoteHref} className="btn-primary mt-8 inline-flex min-h-[48px]">
              Get a free quote
            </Link>
          </div>
          <PageHeroImage asset={heroAsset} className="shadow-luxury" />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy">What&apos;s included</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
              {s.included.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-navy/10 bg-sky/40 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy">Who it&apos;s for</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
              {s.whoItsFor.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy">Our process</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((line, i) => (
              <li
                key={line}
                className="rounded-xl border border-navy/[0.06] bg-cream/50 p-4 text-sm text-charcoal/90"
              >
                <span className="text-[10px] font-bold tracking-[0.25em] text-aqua-muted">
                  STEP {i + 1}
                </span>
                <p className="mt-2 leading-relaxed">{line}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="pricing"
          className="mt-6 scroll-mt-28 rounded-2xl border border-navy/10 bg-sand/40 p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-navy">Starting pricing</h2>
          <p className="mt-3 text-charcoal/90">{s.startingPriceLabel}</p>
          <p className="mt-2 text-sm text-charcoal/80">
            Final pricing depends on property size, condition, access, and scope. Send photos for
            the fastest estimate.
          </p>
          <Link href={quoteHref} className="btn-primary mt-5">
            Get a free quote
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">Local service area</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-charcoal/90 sm:text-base">
            {locationParagraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">FAQ</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {s.faq.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-navy/[0.08] bg-white p-5 shadow-sm"
              >
                <dt className="font-semibold text-charcoal">{item.q}</dt>
                <dd className="mt-2 text-sm text-charcoal/90">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10 rounded-2xl border border-leaf/30 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy">Why choose {SITE_NAME}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {SERVICE_TRUST_BULLETS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-charcoal/90">
                <span className="font-bold text-leaf" aria-hidden>
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        </section>

        {related.length ? (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-navy">Related services</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/services/${r.slug}`}
                    className="btn-secondary px-4 py-2 text-xs sm:text-sm"
                  >
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="relative mt-12 overflow-hidden rounded-2xl bg-gradient-to-b from-charcoal to-navy-deep p-8 text-center text-cream shadow-luxury md:rounded-3xl md:p-10">
          <div className="hero-grain pointer-events-none absolute inset-0 opacity-10" aria-hidden />
          <p className="relative text-lg font-semibold">Book service or request pricing</p>
          <p className="relative mt-2 text-sm text-silver/90">
            Quotes, scheduling, invoices, and approvals are handled on Palm Beach Property Pros.
          </p>
          <Link href={quoteHref} className="btn-hero-primary relative mt-6 min-h-[48px] sm:w-auto">
            Request a quote
          </Link>
        </div>
      </article>
    </div>
  );
}
