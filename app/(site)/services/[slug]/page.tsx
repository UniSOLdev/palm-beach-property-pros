import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { ClosingCta, ServiceCard } from "@/components/site/sections";
import { CATALOG, CATEGORIES, getCatalogService, servicesIn } from "@/lib/site/catalog";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CATALOG.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getCatalogService(slug);
  if (!s) return {};
  return {
    title: s.seoTitle,
    description: s.seoDescription,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: { title: s.seoTitle, description: s.seoDescription, url: `/services/${s.slug}`, images: [{ url: s.image }] },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getCatalogService(slug);
  if (!service) notFound();
  const category = CATEGORIES.find((c) => c.id === service.category)!;
  const related = [...servicesIn(service.category), ...CATALOG].filter((s, i, arr) => s.slug !== service.slug && arr.findIndex((x) => x.slug === s.slug) === i).slice(0, 3);
  const quoteHref = `/quote?service=${encodeURIComponent(service.name)}`;

  return (
    <>
      <ServiceJsonLd service={service} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.name, path: `/services/${service.slug}` },
        ]}
      />
      <PageHero eyebrow={category.eyebrow} title={service.name} lead={service.summary} image={service.image} imageAlt={service.imageAlt}>
        <Link href={quoteHref} className="btn-gold">Request a private quote</Link>
        <a href={PHONE_TEL} className="btn-ghost-light">Call {PHONE_DISPLAY}</a>
      </PageHero>

      <section className="bg-cream py-20 sm:py-28">
        <div className="site-container grid gap-14 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
          <div>
            <nav aria-label="Breadcrumb" className="text-base text-charcoal/70">
              <Link href="/services" className="underline underline-offset-4">Services</Link> <span aria-hidden="true">/</span> {service.name}
            </nav>
            <Reveal>
              <p className="font-display mt-8 text-3xl leading-snug text-navy sm:text-4xl">{service.intro}</p>
            </Reveal>
            <Reveal>
              <h2 className="mt-14 text-xs font-semibold uppercase tracking-[0.3em] text-brass-dark">What&apos;s included</h2>
              <ul className="mt-6 divide-y divide-navy/10 border-y border-navy/10">
                {service.includes.map((item) => (
                  <li key={item} className="flex gap-4 py-4 text-lg leading-relaxed text-charcoal/90">
                    <span aria-hidden="true" className="mt-3 h-px w-5 shrink-0 bg-brass-dark" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            {service.idealFor.length ? (
              <Reveal>
                <h2 className="mt-14 text-xs font-semibold uppercase tracking-[0.3em] text-brass-dark">Ideal for</h2>
                <ul className="mt-6 space-y-3">
                  {service.idealFor.map((w) => (
                    <li key={w} className="text-lg leading-relaxed text-charcoal/90">{w}</li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
            {service.faq.length ? (
              <Reveal>
                <h2 className="mt-14 text-xs font-semibold uppercase tracking-[0.3em] text-brass-dark">Questions</h2>
                <div className="mt-4 divide-y divide-navy/10 border-y border-navy/10">
                  {service.faq.map((f) => (
                    <details key={f.q} className="group">
                      <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-medium text-navy [&::-webkit-details-marker]:hidden">
                        {f.q}
                        <span aria-hidden="true" className="text-2xl font-light text-brass-dark transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="pb-5 text-lg leading-relaxed text-charcoal/80">{f.a}</p>
                    </details>
                  ))}
                </div>
              </Reveal>
            ) : null}
          </div>
          <aside className="h-fit lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-[28px] bg-navy text-cream">
              <div className="relative aspect-[4/3]">
                <Image src={category.image} alt={category.imageAlt} fill sizes="(min-width: 1024px) 30vw, 100vw" quality={60} className="object-cover" />
              </div>
              <div className="p-8">
                <p className="font-display text-3xl">A private quote</p>
                <p className="mt-3 text-lg leading-relaxed text-cream/85">Pricing reflects your property, scope, and schedule. A short call or request is all it takes.</p>
                <Link href={quoteHref} className="btn-gold mt-6 w-full">Request a quote</Link>
                <a href={PHONE_TEL} className="btn-ghost-light mt-3 w-full">Call {PHONE_DISPLAY}</a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section aria-labelledby="related-title" className="bg-cream-warm py-20 sm:py-28">
        <div className="site-container">
          <h2 id="related-title" className="font-display text-4xl text-navy sm:text-5xl">Often paired with</h2>
          <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </div>
      </section>
      <ClosingCta />
    </>
  );
}
