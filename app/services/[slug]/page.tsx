import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
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

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getServiceBySlug(slug);
  if (!s) return {};
  return {
    title: `${s.name} | Palm Beach County`,
    description: `${s.shortDescription} Licensed & insured. Request scope via ${SITE_NAME} quick access.`,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const s = getServiceBySlug(slug);
  if (!s) notFound();

  const processSteps = s.process ?? DEFAULT_SERVICE_PROCESS;
  const locationParagraphs = serviceLocationSeoParagraphs(s.name);
  const related = getRelatedServices(s.slug as ServiceSlug, 3);

  return (
    <div className="bg-cream">
      <article className="mx-auto w-full max-w-6xl px-6 py-16">
        <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
          ← All services
        </Link>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {s.headline}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-charcoal/90">{s.authorityIntro}</p>

        <section className="mt-10 max-w-3xl rounded-xl border border-navy/10 bg-white p-6 shadow-md">
          <h2 className="text-lg font-bold text-navy">What&apos;s included</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
            {s.included.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 max-w-3xl rounded-xl border border-navy/10 bg-sky/40 p-6 shadow-md">
          <h2 className="text-lg font-bold text-navy">Who it&apos;s for</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
            {s.whoItsFor.map((line) => (
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

        <section
          id="pricing"
          className="mt-8 max-w-3xl scroll-mt-28 rounded-xl border border-navy/10 bg-sand/40 p-6 shadow-md"
        >
          <h2 className="text-lg font-bold text-navy">Starting pricing</h2>
          <p className="mt-3 text-charcoal/90">{s.startingPriceLabel}</p>
          <p className="mt-2 text-sm text-charcoal/80">
            Final pricing depends on property size, condition, access, and scope. Send photos for
            the fastest estimate.
          </p>
          <a
            href={LINKR_URL}
            target="_blank"
            rel={linkrRel}
            className="btn-primary mt-5"
          >
            Get a free quote
          </a>
        </section>

        <section className="mt-10 max-w-3xl">
          <h2 className="text-xl font-bold text-navy">Local service area</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-charcoal/90 sm:text-base">
            {locationParagraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section className="mt-10 max-w-3xl">
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

        {related.length ? (
          <section className="mt-10 max-w-3xl">
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

        <div className="mt-12 max-w-3xl rounded-xl bg-navy p-8 text-center text-cream shadow-md">
          <p className="text-lg font-semibold">Book service or request pricing</p>
          <p className="mt-2 text-sm text-cream/85">
            Use our quick access page for quotes, scheduling, invoices, and reviews.
          </p>
          <a
            href={LINKR_URL}
            target="_blank"
            rel={linkrRel}
            className="btn-inverse-lg mt-6 w-full text-base sm:w-auto"
          >
            Open quick access page
          </a>
        </div>
      </article>
    </div>
  );
}
