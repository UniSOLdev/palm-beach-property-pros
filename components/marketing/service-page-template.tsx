import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { EstimateCta } from "@/components/marketing/estimate-cta";
import {
  BreadcrumbJsonLd,
  FaqJsonLd,
  ServiceJsonLd,
} from "@/components/json-ld";
import { DEFAULT_SERVICE_PROCESS, SERVICE_TRUST_BULLETS } from "@/lib/service-trust";
import { CTA } from "@/lib/cta";
import { QUOTE_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

export type ServicePageContent = {
  slug: string;
  name: string;
  headline: string;
  intro: string;
  benefits: string[];
  included: string[];
  whoItsFor: string[];
  process?: readonly string[];
  faq: readonly { q: string; a: string }[];
  startingPriceLabel?: string;
  relatedLinks?: { href: string; label: string }[];
  locationParagraphs?: string[];
};

type Props = {
  service: ServicePageContent;
  breadcrumbParent?: { name: string; href: string };
};

export function ServicePageTemplate({ service, breadcrumbParent }: Props) {
  const processSteps = service.process ?? DEFAULT_SERVICE_PROCESS;
  const quoteHref = `${QUOTE_PATH}?service=${encodeURIComponent(service.name)}`;
  const canonicalPath = `/${service.slug}`;
  const breadcrumbs = [
    { name: "Home", href: SITE_URL },
    ...(breadcrumbParent
      ? [{ name: breadcrumbParent.name, href: `${SITE_URL}${breadcrumbParent.href}` }]
      : []),
    { name: service.name, href: `${SITE_URL}${canonicalPath}` },
  ];

  return (
    <>
      <ServiceJsonLd
        name={service.name}
        description={service.intro}
        url={`${SITE_URL}${canonicalPath}`}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {service.faq.length > 0 ? <FaqJsonLd items={service.faq} /> : null}

      <div className="bg-cream">
        <article className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-ocean">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span className="mx-2 text-charcoal/40">/</span>
            <Link href="/services" className="hover:underline">
              Services
            </Link>
            <span className="mx-2 text-charcoal/40">/</span>
            <span className="text-charcoal/70">{service.name}</span>
          </nav>

          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {service.headline}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-charcoal/90">{service.intro}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={quoteHref} className="btn-primary">
              {CTA.primaryEstimate}
            </Link>
            <Link href="/services" className="btn-secondary">
              {CTA.viewServices}
            </Link>
          </div>

          {service.benefits.length > 0 ? (
            <section className="mt-10 max-w-3xl">
              <h2 className="text-xl font-bold text-navy">Why homeowners and managers choose us</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {service.benefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 rounded-xl border border-navy/10 bg-white p-4 text-sm text-charcoal/85 shadow-sm"
                  >
                    <span className="mt-1 font-bold text-leaf" aria-hidden>
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-10 max-w-3xl rounded-xl border border-navy/10 bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">What&apos;s included</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
              {service.included.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="mt-8 max-w-3xl rounded-xl border border-navy/10 bg-sky/40 p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">Who this service is for</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
              {service.whoItsFor.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="mt-8 max-w-3xl rounded-xl border border-navy/10 bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">Our process</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-charcoal/90">
              {processSteps.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </section>

          {service.startingPriceLabel ? (
            <section
              id="pricing"
              className="mt-8 max-w-3xl scroll-mt-28 rounded-xl border border-navy/10 bg-sand/40 p-6 shadow-md"
            >
              <h2 className="text-lg font-bold text-navy">Starting pricing</h2>
              <p className="mt-3 text-charcoal/90">{service.startingPriceLabel}</p>
              <p className="mt-2 text-sm text-charcoal/80">
                Final pricing depends on property size, condition, access, and scope. Send photos for
                the fastest estimate.
              </p>
            </section>
          ) : null}

          {service.locationParagraphs && service.locationParagraphs.length > 0 ? (
            <section className="mt-10 max-w-3xl">
              <h2 className="text-xl font-bold text-navy">Local service area</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-charcoal/90 sm:text-base">
                {service.locationParagraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold text-navy">FAQ</h2>
            <div className="mt-6">
              <FaqAccordion
                items={service.faq.map((f) => ({ question: f.q, answer: f.a }))}
              />
            </div>
          </section>

          <section className="mt-10 max-w-3xl rounded-xl border border-leaf/30 bg-white p-6 shadow-md">
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

          {service.relatedLinks && service.relatedLinks.length > 0 ? (
            <section className="mt-10 max-w-3xl">
              <h2 className="text-lg font-bold text-navy">Related services</h2>
              <ul className="mt-3 flex flex-wrap gap-3">
                {service.relatedLinks.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} className="btn-secondary px-4 py-2 text-xs sm:text-sm">
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>

        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <EstimateCta />
        </div>
      </div>
    </>
  );
}
