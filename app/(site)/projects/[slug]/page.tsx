import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateCta } from "@/components/marketing/estimate-cta";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { CASE_STUDIES, getCaseStudyBySlug } from "@/lib/case-studies";
import { CTA } from "@/lib/cta";
import { QUOTE_PATH, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CASE_STUDIES.filter((c) => c.published).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return {};
  const canonical = `${SITE_URL}/projects/${slug}`;
  return {
    title: `${study.title} — ${study.city}`,
    description: study.summary,
    alternates: { canonical },
    openGraph: {
      title: study.title,
      description: study.summary,
      url: canonical,
      type: "article",
    },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) notFound();

  const canonical = `${SITE_URL}/projects/${slug}`;
  const breadcrumbs = [
    { name: "Home", href: SITE_URL },
    { name: "Projects", href: `${SITE_URL}/projects/${slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div className="bg-cream">
        <article className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <Link href="/" className="text-sm font-semibold text-ocean hover:underline">
            ← Back to home
          </Link>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua-muted">
            {study.serviceType} · {study.city}
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {study.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-charcoal/90">{study.summary}</p>
          {study.completionTimeline ? (
            <p className="mt-2 text-sm font-medium text-charcoal/60">{study.completionTimeline}</p>
          ) : null}

          {study.beforeImage && study.afterImage ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={study.beforeImage}
                  alt={study.beforeAlt ?? "Before"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <figcaption className="absolute left-3 top-3 rounded bg-navy/80 px-2 py-1 text-xs font-semibold text-cream">
                  Before
                </figcaption>
              </figure>
              <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={study.afterImage}
                  alt={study.afterAlt ?? "After"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <figcaption className="absolute left-3 top-3 rounded bg-leaf/90 px-2 py-1 text-xs font-semibold text-white">
                  After
                </figcaption>
              </figure>
            </div>
          ) : null}

          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold text-navy">Initial condition</h2>
            <p className="mt-3 text-charcoal/90">{study.initialCondition}</p>
          </section>

          <section className="mt-8 max-w-3xl rounded-xl border border-navy/10 bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">Scope of work</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
              {study.scopeOfWork.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-8 max-w-3xl rounded-xl border border-navy/10 bg-sky/40 p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">Challenges</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
              {study.challenges.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-8 max-w-3xl rounded-xl border border-navy/10 bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold text-navy">Work completed</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-charcoal/90">
              {study.workCompleted.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-8 max-w-3xl">
            <h2 className="text-xl font-bold text-navy">Results</h2>
            <p className="mt-3 text-charcoal/90">{study.results}</p>
          </section>

          {study.customerQuote ? (
            <blockquote className="mt-8 max-w-3xl border-l-4 border-aqua pl-4 italic text-charcoal/80">
              {study.customerQuote}
            </blockquote>
          ) : null}

          <Link href={QUOTE_PATH} className="btn-primary mt-10 inline-flex">
            {CTA.primaryEstimate}
          </Link>
        </article>

        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <EstimateCta />
        </div>
      </div>
    </>
  );
}
