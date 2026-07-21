import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicServiceArea } from "@/lib/admin/actions/service-areas";
import { QUOTE_PATH, SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = await getPublicServiceArea(slug);
  if (!area) return {};
  return {
    title: area.seo_title ?? `${area.name} Property Services | ${SITE_NAME}`,
    description: area.seo_description ?? area.body_content.slice(0, 160),
  };
}

export default async function ServiceAreaCityPage({ params }: Props) {
  const { slug } = await params;
  const area = await getPublicServiceArea(slug);
  if (!area) notFound();

  return (
    <div className="bg-cream">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <Link href="/service-area" className="text-sm font-semibold text-ocean hover:underline">
          ← All service areas
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {area.hero_headline ?? `${area.name} Property Services`}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-charcoal/85">{area.body_content}</p>
        {area.county ? (
          <p className="mt-3 text-sm text-charcoal/60">Serving {area.name} and surrounding areas in {area.county}.</p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={QUOTE_PATH} className="btn-primary">
            Request a Free Estimate
          </Link>
          <Link href="/services/window-cleaning" className="btn-secondary">
            Window detailing
          </Link>
          <Link href="/services/pressure-washing" className="btn-secondary">
            Pressure washing
          </Link>
        </div>
      </section>
    </div>
  );
}
