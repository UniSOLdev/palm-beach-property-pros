import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serviceLocationSeoParagraphs } from "@/lib/location-seo";
import { getSiteServiceBySlug, getSiteServices } from "@/lib/site-content/queries";
import { pricingDisplay, type SiteService } from "@/lib/site-content/types";
import { DEFAULT_SERVICE_PROCESS, SERVICE_TRUST_BULLETS } from "@/lib/service-trust";
import { QUOTE_PATH, SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const services = await getSiteServices({ activeOnly: true });
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSiteServiceBySlug(slug);
  if (!s) return {};
  return {
    title: s.seo_title ?? `${s.title} | Palm Beach County`,
    description:
      s.seo_description ??
      `${s.short_description} Licensed & insured. Request scope via our online quote form.`,
  };
}

function relatedServices(all: SiteService[], currentSlug: string, limit = 3) {
  return all.filter((s) => s.slug !== currentSlug && s.is_active).slice(0, limit);
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const s = await getSiteServiceBySlug(slug);
  if (!s) notFound();

  const allServices = await getSiteServices({ activeOnly: true });
  const processSteps = s.process_steps.length ? s.process_steps : DEFAULT_SERVICE_PROCESS;
  const locationParagraphs = serviceLocationSeoParagraphs(s.title);
  const related = relatedServices(allServices, s.slug, 3);
  const quoteHref = `${QUOTE_PATH}?service=${encodeURIComponent(s.title)}`;
  const priceText = pricingDisplay(s);

  return (
    <div className="bg-cream">
      <article className="mx-auto w-full max-w-6xl px-6 py-16">
        <Link href="/services" className="text-sm font-semibold text-ocean hover:underline">
          ← All services
        </Link>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {s.headline}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-charcoal/90">{s.authority_intro}</p>

        <section className="mt-10 max-w-3xl rounded-xl border border-navy/10 bg-white p-6 shadow-md">
          <h2 className="text-lg font-bold text-navy">What&apos;s included</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
            {s.included.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {s.add_ons.length ? (
            <>
              <h3 className="mt-5 text-base font-semibold text-navy">Optional add-ons</h3>
              <ul className="mt-2 list-inside list-disc space-y-2 text-charcoal/90">
                {s.add_ons.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        {s.water_access_note ? (
          <section className="mt-8 max-w-3xl rounded-xl border border-ocean/20 bg-sky/30 p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">Water access</h2>
            <p className="mt-3 text-charcoal/90">{s.water_access_note}</p>
          </section>
        ) : null}

        {s.who_its_for.length ? (
          <section className="mt-8 max-w-3xl rounded-xl border border-navy/10 bg-sky/40 p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">Who it&apos;s for</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
              {s.who_its_for.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8 max-w-3xl rounded-xl border border-navy/10 bg-white p-6 shadow-md">
          <h2 className="text-lg font-bold text-navy">Our process</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-charcoal/90">
            {processSteps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        {priceText ? (
          <section
            id="pricing"
            className="mt-8 max-w-3xl scroll-mt-28 rounded-xl border border-navy/10 bg-sand/40 p-6 shadow-md"
          >
            <h2 className="text-lg font-bold text-navy">Pricing</h2>
            <p className="mt-3 text-charcoal/90">{priceText}</p>
            <p className="mt-2 text-sm text-charcoal/80">
              Final pricing depends on property size, condition, access, and scope. Send photos for the
              fastest estimate.
            </p>
            <Link href={quoteHref} className="btn-primary mt-5">
              Request a Free Estimate
            </Link>
          </section>
        ) : (
          <section className="mt-8 max-w-3xl rounded-xl border border-navy/10 bg-sand/40 p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">Custom estimate</h2>
            <p className="mt-3 text-charcoal/90">
              Every property is different. Share photos and scope details for a written estimate.
            </p>
            <Link href={quoteHref} className="btn-primary mt-5">
              Request a Free Estimate
            </Link>
          </section>
        )}

        <section className="mt-10 max-w-3xl">
          <h2 className="text-xl font-bold text-navy">Local service area</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-charcoal/90 sm:text-base">
            {locationParagraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        {s.faqs?.length ? (
          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold text-navy">FAQ</h2>
            <dl className="mt-4 space-y-5">
              {s.faqs.map((item) => (
                <div key={item.id}>
                  <dt className="font-semibold text-charcoal">{item.question}</dt>
                  <dd className="mt-1 text-charcoal/90">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

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
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-12 max-w-3xl rounded-xl bg-navy p-8 text-center text-cream shadow-md">
          <p className="text-lg font-semibold">{s.cta_headline}</p>
          {s.cta_body ? <p className="mt-2 text-sm text-cream/85">{s.cta_body}</p> : null}
          <Link href={quoteHref} className="btn-inverse-lg mt-6 w-full text-base sm:w-auto">
            Request a Free Estimate
          </Link>
        </div>
      </article>
    </div>
  );
}
