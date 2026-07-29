import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ServicePageTemplate } from "@/components/marketing/service-page-template";
import { serviceLocationSeoParagraphs } from "@/lib/location-seo";
import { getLegacyServiceRedirect } from "@/lib/service-pages";
import { getRelatedServices, getServiceBySlug, SERVICES } from "@/lib/services";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const redirectTo = getLegacyServiceRedirect(slug);
  if (redirectTo) return {};
  const s = getServiceBySlug(slug);
  if (!s) return {};
  return {
    title: `${s.name} | Palm Beach County`,
    description: s.shortDescription,
    alternates: { canonical: `${SITE_URL}/services/${slug}` },
  };
}

/** Legacy /services/[slug] — redirects primary services to flat URLs; renders remaining services in place. */
export default async function LegacyServicePage({ params }: Props) {
  const { slug } = await params;
  const redirectTo = getLegacyServiceRedirect(slug);
  if (redirectTo) redirect(redirectTo);

  const s = getServiceBySlug(slug);
  if (!s) notFound();

  const related = getRelatedServices(s.slug, 3);

  return (
    <ServicePageTemplate
      service={{
        slug: s.slug,
        name: s.name,
        headline: s.headline,
        intro: s.authorityIntro,
        benefits: [
          "Clear estimates with photos before work begins",
          "Reliable scheduling and service updates",
          `Local Palm Beach County experience with ${s.name.toLowerCase()}`,
          "Before-and-after documentation when helpful",
        ],
        included: [...s.included],
        whoItsFor: [...s.whoItsFor],
        process: s.process,
        faq: s.faq,
        startingPriceLabel: s.startingPriceLabel,
        locationParagraphs: serviceLocationSeoParagraphs(s.name),
        relatedLinks: related.map((r) => {
          const target = getLegacyServiceRedirect(r.slug);
          return {
            href: target ?? `/services/${r.slug}`,
            label: r.name,
          };
        }),
      }}
      breadcrumbParent={{ name: "Services", href: "/services" }}
    />
  );
}
