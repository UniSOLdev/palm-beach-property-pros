import Link from "next/link";
import Image from "next/image";
import type { CaseStudy } from "@/lib/case-studies";
import { CTA } from "@/lib/cta";

export function CaseStudyPreview({ study }: { study: CaseStudy }) {
  return (
    <article className="grid gap-8 overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-sm lg:grid-cols-2 lg:items-center">
      {study.beforeImage && study.afterImage ? (
        <div className="grid grid-cols-2 gap-1">
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={study.beforeImage}
              alt={study.beforeAlt ?? `Before — ${study.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 25vw"
            />
            <span className="absolute left-2 top-2 rounded bg-navy/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
              Before
            </span>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={study.afterImage}
              alt={study.afterAlt ?? `After — ${study.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 25vw"
            />
            <span className="absolute left-2 top-2 rounded bg-leaf/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              After
            </span>
          </div>
        </div>
      ) : null}
      <div className="p-6 lg:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua-muted">
          {study.serviceType} · {study.city}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-navy">{study.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/75">{study.summary}</p>
        {study.completionTimeline ? (
          <p className="mt-3 text-xs font-medium text-charcoal/60">{study.completionTimeline}</p>
        ) : null}
        <Link href={`/projects/${study.slug}`} className="link-luxury mt-5 inline-block text-sm">
          {CTA.seeProjectResults} →
        </Link>
      </div>
    </article>
  );
}
