import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/json-ld";
import { QuoteSection } from "@/components/site/sections";
import { AREA_NAMES, SERVICES, getService } from "@/lib/site/content";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return {};
  return {
    title: s.seoTitle,
    description: s.seoDescription,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: { title: s.seoTitle, description: s.seoDescription, url: `/services/${s.slug}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  const others = SERVICES.filter((s) => s.slug !== service.slug);

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
      <section className="bg-cream py-16 sm:py-20">
        <div className="site-container grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <nav aria-label="Breadcrumb" className="text-base text-charcoal/80">
              <Link href="/services" className="underline">
                Services
              </Link>{" "}
              / {service.name}
            </nav>
            <h1 className="font-display mt-4 text-5xl font-medium leading-tight text-navy sm:text-6xl">
              {service.name}
            </h1>
            <p className="lead-text mt-6">{service.intro}</p>
            <h2 className="mt-10 text-2xl font-semibold text-navy">What&apos;s included</h2>
            <ul className="mt-5 space-y-3">
              {service.includes.map((item) => (
                <li key={item} className="flex gap-3 text-lg leading-relaxed text-charcoal/90">
                  <span aria-hidden="true" className="mt-1 text-brass-dark">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-lg text-charcoal/90">
              <strong className="text-navy">Ideal for:</strong> {service.idealFor}
            </p>
            <p className="mt-3 text-lg text-charcoal/90">
              <strong className="text-navy">Available in:</strong> {AREA_NAMES.join(", ")}.
            </p>
          </div>
          <aside className="h-fit rounded-3xl bg-navy p-8 text-cream lg:sticky lg:top-28">
            <p className="font-display text-3xl">Private quote</p>
            <p className="mt-3 text-lg leading-relaxed text-cream/90">
              Pricing depends on your home and your schedule. A short call is all it takes.
            </p>
            <a href={PHONE_TEL} className="btn-gold mt-6 w-full">
              Call {PHONE_DISPLAY}
            </a>
            <Link
              href={`/quote?service=${encodeURIComponent(service.name)}`}
              className="btn-ghost-light mt-3 w-full"
            >
              Request a quote
            </Link>
          </aside>
        </div>
      </section>
      <section aria-labelledby="related-title" className="bg-cream-warm py-16">
        <div className="site-container">
          <h2 id="related-title" className="font-display text-4xl text-navy">
            Often paired with
          </h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/services/${o.slug}`}
                  className="inline-flex min-h-[48px] items-center rounded-full border border-navy/20 bg-white px-5 text-lg text-navy no-underline hover:border-navy"
                >
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <QuoteSection defaultService={service.name} />
    </>
  );
}
