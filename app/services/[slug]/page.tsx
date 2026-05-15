import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PbppCtaLink } from "@/components/pbpp-cta-link";
import { CTA_LABELS, PBPP_ROUTES } from "@/lib/cta-routes";
import { getPublishedSeoForKey, getPublishedServiceOverlay } from "@/lib/cms-queries";
import { mergeServiceWithCmsOverlay } from "@/lib/cms-service-merge";
import { serviceLocationSeoParagraphs } from "@/lib/location-seo";
import {
  getRelatedServices,
  getServiceBySlug,
  SERVICES,
  type ServiceSlug,
} from "@/lib/services";
import { DEFAULT_SERVICE_PROCESS, SERVICE_TRUST_BULLETS } from "@/lib/service-trust";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 120;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const base = getServiceBySlug(slug);
  if (!base) return {};
  const overlay = await getPublishedServiceOverlay(slug);
  const s = mergeServiceWithCmsOverlay(base, overlay);
  const seo = await getPublishedSeoForKey(`service:${slug}`);
  return {
    title: seo?.title ?? `${s.name} | Palm Beach County`,
    description:
      seo?.description ??
      `${s.shortDescription} Licensed & insured. Request scope via ${SITE_NAME} online quote form.`,
    openGraph: seo?.og_image_url ? { images: [{ url: seo.og_image_url }] } : undefined,
    robots:
      seo?.robots_index === false || seo?.robots_follow === false
        ? { index: seo.robots_index !== false, follow: seo.robots_follow !== false }
        : undefined,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const base = getServiceBySlug(slug);
  if (!base) notFound();
  const overlay = await getPublishedServiceOverlay(slug);
  const s = mergeServiceWithCmsOverlay(base, overlay);

  const processSteps = s.process ?? DEFAULT_SERVICE_PROCESS;
  const locationParagraphs = serviceLocationSeoParagraphs(s.name);
  const related = getRelatedServices(s.slug as ServiceSlug, 3);

  return (
    <div className="bg-cream">
      <article className="mx-auto w-full max-w-3xl py-14">
        <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
          ← All services
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {s.headline}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-charcoal/90">{s.authorityIntro}</p>

        <section className="mt-10 rounded-3xl border border-navy/10 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-navy">What&apos;s included</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
            {s.included.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-3xl border border-navy/10 bg-sky/40 p-6">
          <h2 className="text-lg font-bold text-navy">Who it&apos;s for</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
            {s.whoItsFor.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-3xl border border-navy/10 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-navy">Our process</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-charcoal/90">
            {processSteps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        <section
          id="pricing"
          className="mt-8 scroll-mt-28 rounded-3xl border border-navy/10 bg-sand/40 p-6"
        >
          <h2 className="text-lg font-bold text-navy">Starting pricing</h2>
          <p className="mt-3 text-charcoal/90">{s.startingPriceLabel}</p>
          <p className="mt-2 text-sm text-charcoal/80">
            Final pricing depends on property size, condition, access, and scope. Send photos for
            the fastest estimate.
          </p>
          <PbppCtaLink href={PBPP_ROUTES.quote} className="btn-primary mt-5">
            {CTA_LABELS.getAFreeQuote}
          </PbppCtaLink>
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
          <dl className="mt-4 space-y-5">
            {s.faq.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-charcoal">{item.q}</dt>
                <dd className="mt-1 text-charcoal/90">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10 rounded-3xl border border-leaf/30 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-navy">Why choose {SITE_NAME}</h2>
          <ul className="mt-3 space-y-2 text-charcoal/90">
            {SERVICE_TRUST_BULLETS.map((b) => (
              <li key={b}>
                <span className="mr-2 font-bold text-leaf" aria-hidden>
                  •
                </span>
                {b}
              </li>
            ))}
          </ul>
        </section>

        {related.length ? (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-navy">Related services</h2>
            <ul className="mt-3 flex flex-wrap gap-3">
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

        <div className="mt-12 rounded-3xl bg-navy p-8 text-center text-cream shadow-lift">
          <p className="text-lg font-semibold">Book service or request pricing</p>
          <p className="mt-2 text-sm text-cream/85">
            Request a quote, manage invoices, and access client tools—all on the PBPP platform.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <PbppCtaLink
              href={PBPP_ROUTES.quote}
              className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-4 text-sm font-semibold text-navy no-underline hover:bg-sky sm:w-auto"
            >
              {CTA_LABELS.getAFreeQuote}
            </PbppCtaLink>
            <PbppCtaLink
              href={PBPP_ROUTES.clientPortal}
              className="inline-flex w-full items-center justify-center rounded-lg border border-cream/30 bg-transparent px-6 py-4 text-sm font-semibold text-cream no-underline hover:bg-white/10 sm:w-auto"
            >
              {CTA_LABELS.openClientPortal}
            </PbppCtaLink>
          </div>
        </div>
      </article>
    </div>
  );
}
