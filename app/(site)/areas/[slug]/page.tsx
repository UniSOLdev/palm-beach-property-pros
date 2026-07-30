import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqAccordion } from "@/components/faq-accordion";
import { EstimateCta } from "@/components/marketing/estimate-cta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/json-ld";
import { CTA } from "@/lib/cta";
import {
  getAllLocationSlugs,
  getLocationBySlug,
  PRIMARY_LOCATION_SLUGS,
} from "@/lib/locations";
import { QUOTE_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllLocationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) return {};
  const canonical = `${SITE_URL}/areas/${slug}`;
  return {
    title: `${location.headline}`,
    description: location.intro,
    alternates: { canonical },
    openGraph: {
      title: `${location.name} Property Services | ${SITE_NAME}`,
      description: location.intro,
      url: canonical,
      type: "website",
    },
  };
}

const SERVICE_LINKS = [
  { href: "/window-cleaning", label: "Window cleaning" },
  { href: "/pressure-washing", label: "Pressure washing" },
  { href: "/residential-cleaning", label: "Residential cleaning" },
  { href: "/commercial-cleaning", label: "Commercial cleaning" },
  { href: "/property-care", label: "Property & estate care" },
  { href: "/vacation-home-checks", label: "Vacation home checks" },
  { href: "/mobile-detailing", label: "Mobile detailing" },
];

export default async function LocationPage({ params }: Props) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) notFound();

  const canonical = `${SITE_URL}/areas/${slug}`;
  const breadcrumbs = [
    { name: "Home", href: SITE_URL },
    { name: "Service Area", href: `${SITE_URL}/service-area` },
    { name: location.name, href: canonical },
  ];

  const nearby = location.nearbyAreas
    .map((name) => PRIMARY_LOCATION_SLUGS.map((s) => getLocationBySlug(s)).find((l) => l?.name === name))
    .filter(Boolean);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FaqJsonLd items={location.faq} />

      <div className="bg-cream">
        <article className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-ocean">
            <Link href="/service-area" className="hover:underline">
              Service area
            </Link>
            <span className="mx-2 text-charcoal/40">/</span>
            <span className="text-charcoal/70">{location.name}</span>
          </nav>

          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {location.headline}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-charcoal/90">{location.intro}</p>

          <Link href={QUOTE_PATH} className="btn-primary mt-8 inline-flex">
            {CTA.primaryEstimate}
          </Link>

          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold text-navy">Services available in {location.name}</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {location.servicesAvailable.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-charcoal/85">
                  <span className="mt-1.5 font-bold text-leaf" aria-hidden>
                    ✓
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 max-w-3xl rounded-xl border border-navy/10 bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">Local property types we serve</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
              {location.propertyTypes.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>

          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold text-navy">Related services</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {SERVICE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="btn-secondary px-4 py-2 text-xs sm:text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {nearby.length > 0 ? (
            <section className="mt-10 max-w-3xl">
              <h2 className="text-xl font-bold text-navy">Nearby areas we also serve</h2>
              <ul className="mt-4 flex flex-wrap gap-3">
                {nearby.map((loc) =>
                  loc ? (
                    <li key={loc.slug}>
                      <Link
                        href={`/areas/${loc.slug}`}
                        className="rounded-full border border-navy/10 bg-white px-4 py-2 text-sm text-charcoal/85 no-underline hover:border-ocean/30 hover:text-navy"
                      >
                        {loc.name}
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            </section>
          ) : null}

          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold text-navy">FAQ — {location.name}</h2>
            <div className="mt-6">
              <FaqAccordion
                items={location.faq.map((f) => ({ question: f.q, answer: f.a }))}
              />
            </div>
          </section>
        </article>

        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <EstimateCta />
        </div>
      </div>
    </>
  );
}
