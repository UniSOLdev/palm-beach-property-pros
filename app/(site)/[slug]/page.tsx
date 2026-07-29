import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageTemplate } from "@/components/marketing/service-page-template";
import { getFlatServicePage, getAllFlatServiceSlugs } from "@/lib/service-pages";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllFlatServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getFlatServicePage(slug);
  if (!page) return {};
  const canonical = `${SITE_URL}/${slug}`;
  return {
    title: `${page.headline}`,
    description: page.intro,
    alternates: { canonical },
    openGraph: {
      title: `${page.name} | Palm Beach Property Pros`,
      description: page.intro,
      url: canonical,
      type: "website",
    },
  };
}

export default async function FlatServicePage({ params }: Props) {
  const { slug } = await params;
  const page = getFlatServicePage(slug);
  if (!page) notFound();
  return <ServicePageTemplate service={page} />;
}
