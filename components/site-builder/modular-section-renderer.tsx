"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BeforeAfterGrid } from "@/components/media/before-after-grid";
import { DocumentationSuite } from "@/components/media/documentation-suite";
import { FieldExecutionTimeline } from "@/components/media/field-execution-timeline";
import { MediaAssetImage } from "@/components/media/media-asset-image";
import { MediaFrame } from "@/components/media/media-frame";
import { TransformationShowcase } from "@/components/media/transformation-showcase";
import { FallbackHeroMedia } from "@/components/marketing/curated-hero-media";
import { listTransformationPairsAction } from "@/lib/admin/actions/projects";
import { MEDIA_REGISTRY, OPERATIONAL_PROOF, LOCAL_MARKETS, FIELD_EXECUTION_STEPS } from "@/lib/media";
import type { MediaAsset, TransformationProject } from "@/lib/media/types";
import { buildMediaUrl } from "@/lib/media/resolve";
import { pairToCompareProps } from "@/lib/site-builder/queries/content";
import type { BeforeAfterPair } from "@/lib/media-curation/types";
import {
  parseModularSectionContent,
  type ModularSectionType,
} from "@/lib/site-builder/schemas";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export type ModularSectionEditorBridge = {
  enabled: boolean;
  sectionId: string;
  patchField: (path: string, value: unknown) => void;
};

type Props = {
  sectionType: ModularSectionType;
  content: Record<string, unknown>;
  editor?: ModularSectionEditorBridge;
  preview?: boolean;
  /** When true, never inject static marketing fallbacks — builder canvas only */
  strictContent?: boolean;
};

function EmptyContentPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-2xl border-2 border-dashed border-navy/15 bg-white/50 px-6 py-8 text-center text-sm text-charcoal/55">
      {message}
    </div>
  );
}

function SectionShell({
  eyebrow,
  headline,
  lead,
  children,
}: {
  eyebrow?: string;
  headline: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="section-eyebrow text-ocean">{eyebrow}</p> : null}
        <h2 className="section-title mt-4">{headline}</h2>
        {lead ? <p className="section-lead">{lead}</p> : null}
      </div>
      {children ? <div className="mt-12">{children}</div> : null}
    </section>
  );
}

export function ModularSectionRenderer({ sectionType, content, editor, preview, strictContent }: Props) {
  const builderMode = strictContent ?? Boolean(editor?.enabled);
  switch (sectionType) {
    case "hero_v2":
      return <HeroSectionView content={content} strictContent={builderMode} />;
    case "transformation_proof":
      return <TransformationProofView content={content} preview={preview} strictContent={builderMode} />;
    case "transformation_arc":
      return <TransformationArcView content={content} strictContent={builderMode} />;
    case "additional_proof":
      return <AdditionalProofView content={content} preview={preview} strictContent={builderMode} />;
    case "recurring_programs":
      return <RecurringProgramsView content={content} strictContent={builderMode} />;
    case "service_divisions":
      return <ServiceDivisionsView content={content} />;
    case "project_recap":
      return <ProjectRecapView content={content} strictContent={builderMode} />;
    case "who_we_serve":
      return <WhoWeServeView content={content} strictContent={builderMode} />;
    case "operational_credibility":
      return <OperationalCredibilityView content={content} strictContent={builderMode} />;
    case "local_presence":
      return <LocalPresenceView content={content} strictContent={builderMode} />;
    case "workflow":
      return <WorkflowView content={content} strictContent={builderMode} />;
    case "documentation_systems":
      return <DocumentationSystemsView content={content} strictContent={builderMode} />;
    case "cta_v2":
      return <CtaSectionView content={content} />;
    default:
      return (
        <div className="admin-card text-sm text-charcoal/60">
          Unknown section type: {sectionType}
          {editor?.enabled ? " — edit in sidebar" : null}
        </div>
      );
  }
}

function HeroSectionView({ content, strictContent }: { content: Record<string, unknown>; strictContent?: boolean }) {
  const data = parseModularSectionContent("hero_v2", content);
  const heroSrc = data.imageUrl ? buildMediaUrl(data.imageUrl, 2000) : null;
  const fallbackSrc = strictContent ? null : buildMediaUrl(MEDIA_REGISTRY.hero.primary.src, 2000);

  return (
    <section className="hero-cinematic relative -mx-4 sm:-mx-6 md:mx-0 md:rounded-3xl">
      {heroSrc || fallbackSrc ? (
        <FallbackHeroMedia src={heroSrc ?? fallbackSrc!} alt={data.headline} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-ocean/80 to-navy/90" />
      )}
      <div className="relative z-10 px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-32">
        <div className="max-w-xl md:max-w-3xl">
          <p className="section-eyebrow text-aqua/90">{data.eyebrow}</p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] text-cream sm:text-5xl md:text-[3.25rem]">{data.headline}</h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-silver/95 sm:text-lg md:text-xl">{data.subheadline}</p>
        </div>
        <ul className="mt-10 flex flex-wrap gap-2.5">
          {data.chips.map((chip) => (
            <li key={chip} className="luxury-pill">{chip}</li>
          ))}
        </ul>
        <div className="mt-12 flex flex-col gap-3 md:flex-row">
          <Link href={data.primaryCta.href} className="btn-hero-primary min-h-[56px]">{data.primaryCta.label}</Link>
          {data.secondaryCta ? (
            <Link href={data.secondaryCta.href} className="btn-hero-secondary min-h-[56px]">{data.secondaryCta.label}</Link>
          ) : (
            <a href={PHONE_TEL} className="btn-hero-secondary min-h-[56px]">Call or Text {PHONE_DISPLAY}</a>
          )}
        </div>
      </div>
    </section>
  );
}

function TransformationProofView({
  content,
  preview,
  strictContent,
}: {
  content: Record<string, unknown>;
  preview?: boolean;
  strictContent?: boolean;
}) {
  const data = parseModularSectionContent("transformation_proof", content);
  const [projects, setProjects] = useState<TransformationProject[]>([]);

  useEffect(() => {
    if (data.source !== "database" || !data.pairIds.length) return;
    void listTransformationPairsAction({ pairIds: data.pairIds }).then((pairs) => {
      const mapped: TransformationProject[] = pairs
        .map((pair) => {
          const compare = pairToCompareProps(pair);
          if (!compare) return null;
          return {
            id: pair.id,
            title: pair.project?.title ?? compare.label,
            location: pair.project?.location ?? "Palm Beach County",
            division: "exterior" as const,
            timeframe: "",
            summary: pair.label ?? "",
            scope: [],
            before: { id: `${pair.id}-before`, category: "transformation", src: compare.beforeUrl, alt: compare.beforeAlt, source: "authentic" },
            after: { id: `${pair.id}-after`, category: "transformation", src: compare.afterUrl, alt: compare.afterAlt, source: "authentic" },
            isScaffold: false,
          };
        })
        .filter(Boolean) as TransformationProject[];
      setProjects(mapped);
    });
  }, [data.source, data.pairIds]);

  if (data.source === "database" && !data.pairIds.length) {
    return (
      <SectionShell
        eyebrow={data.eyebrow}
        headline={data.headline}
        lead={preview || strictContent ? "Assign transformation pairs in Admin → Transformations." : data.lead}
      >
        {strictContent ? <EmptyContentPlaceholder message="No transformation pairs assigned yet." /> : null}
      </SectionShell>
    );
  }

  if (strictContent && !projects.length) {
    return (
      <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
        <EmptyContentPlaceholder message="Loading transformation pairs…" />
      </SectionShell>
    );
  }

  return <TransformationShowcase projects={projects} isAuthentic={projects.length > 0} />;
}

function AdditionalProofView({
  content,
  preview,
  strictContent,
}: {
  content: Record<string, unknown>;
  preview?: boolean;
  strictContent?: boolean;
}) {
  const data = parseModularSectionContent("additional_proof", content);
  const [pairs, setPairs] = useState<Array<{ beforeUrl: string; afterUrl: string; label: string; beforeAlt: string; afterAlt: string }>>([]);

  useEffect(() => {
    if (data.source === "database" && data.pairIds.length) {
      void listTransformationPairsAction({ pairIds: data.pairIds }).then((rows) => {
        setPairs(
          rows
            .map((pair) => pairToCompareProps(pair))
            .filter(Boolean)
            .map((p) => ({
              beforeUrl: p!.beforeUrl,
              afterUrl: p!.afterUrl,
              label: p!.label,
              beforeAlt: p!.beforeAlt,
              afterAlt: p!.afterAlt,
            })),
        );
      });
    }
  }, [data.source, data.pairIds]);

  if (!pairs.length) {
    return (
      <SectionShell
        eyebrow={data.eyebrow}
        headline={data.headline}
        lead={preview || strictContent ? "No paired media assigned. Use Transformations → Pair Editor." : data.lead}
      >
        {strictContent ? <EmptyContentPlaceholder message="Assign before/after pairs in Transformations." /> : null}
      </SectionShell>
    );
  }

  return (
    <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
      <BeforeAfterGrid
        pairs={
          pairs.map((p) => ({
            id: p.beforeUrl,
            before: { id: `${p.beforeUrl}-b`, src: p.beforeUrl, alt: p.beforeAlt },
            after: { id: `${p.afterUrl}-a`, src: p.afterUrl, alt: p.afterAlt },
            label: p.label,
            contrastScore: 1,
          })) as BeforeAfterPair[]
        }
      />
    </SectionShell>
  );
}

function TransformationArcView({ content, strictContent }: { content: Record<string, unknown>; strictContent?: boolean }) {
  const data = parseModularSectionContent("transformation_arc", content);
  if (data.useCuratedStoryArc && strictContent) {
    return (
      <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
        <EmptyContentPlaceholder message="Curated story arc content loads on the published site." />
      </SectionShell>
    );
  }
  if (data.useCuratedStoryArc && !strictContent) {
    return null;
  }
  return <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead} />;
}

function RecurringProgramsView({ content, strictContent }: { content: Record<string, unknown>; strictContent?: boolean }) {
  const data = parseModularSectionContent("recurring_programs", content);
  const programs = data.programs.length ? data.programs : [];
  return (
    <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
      {programs.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <article key={program.title} className="luxury-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">{program.eyebrow}</p>
              <h3 className="mt-3 text-xl font-semibold text-navy">{program.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{program.body}</p>
            </article>
          ))}
        </div>
      ) : strictContent ? (
        <EmptyContentPlaceholder message="Add programs in the section editor or connect database source." />
      ) : null}
    </SectionShell>
  );
}

function ServiceDivisionsView({ content }: { content: Record<string, unknown> }) {
  const data = parseModularSectionContent("service_divisions", content);
  return (
    <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
      <div className="grid gap-6 lg:grid-cols-3">
        {data.divisions.map((division) => (
          <article key={division.title} className="luxury-card overflow-hidden">
            {division.media?.src ? (
              <MediaFrame aspect="landscape" className="h-48">
                <MediaAssetImage
                  asset={{
                    id: division.title,
                    category: "exterior",
                    src: division.media.src,
                    alt: division.media.alt ?? division.title,
                    source: "authentic",
                  }}
                />
              </MediaFrame>
            ) : null}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-navy">{division.title}</h3>
              <p className="mt-2 text-sm text-charcoal/75">{division.body}</p>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function ProjectRecapView({ content, strictContent }: { content: Record<string, unknown>; strictContent?: boolean }) {
  const data = parseModularSectionContent("project_recap", content);
  return (
    <SectionShell
      eyebrow={data.eyebrow}
      headline={data.headline}
      lead={data.source === "database" ? "Featured projects load from the Projects library when IDs are assigned." : data.lead}
    >
      {strictContent && data.source === "database" ? (
        <EmptyContentPlaceholder message="Assign featured project IDs in the section editor." />
      ) : null}
    </SectionShell>
  );
}

function WhoWeServeView({ content, strictContent }: { content: Record<string, unknown>; strictContent?: boolean }) {
  const data = parseModularSectionContent("who_we_serve", content);
  return (
    <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
      {data.audiences.length ? (
        <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
          {data.audiences.map((item) => (
            <li key={item} className="luxury-pill bg-white text-navy">{item}</li>
          ))}
        </ul>
      ) : strictContent ? (
        <EmptyContentPlaceholder message="Add audience segments in the section editor." />
      ) : null}
    </SectionShell>
  );
}

function OperationalCredibilityView({ content, strictContent }: { content: Record<string, unknown>; strictContent?: boolean }) {
  const data = parseModularSectionContent("operational_credibility", content);
  const pillars = data.pillars.length
    ? data.pillars
    : strictContent
      ? []
      : OPERATIONAL_PROOF.map((p) => ({ title: p.title, body: p.description }));
  return (
    <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
      {pillars.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="luxury-card p-6 text-left">
              <h3 className="text-lg font-semibold text-navy">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{pillar.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyContentPlaceholder message="Add credibility pillars in the section editor." />
      )}
    </SectionShell>
  );
}

function LocalPresenceView({ content, strictContent }: { content: Record<string, unknown>; strictContent?: boolean }) {
  const data = parseModularSectionContent("local_presence", content);
  const markets = data.markets.length
    ? data.markets
    : strictContent
      ? []
      : LOCAL_MARKETS.map((name) => ({ name, detail: undefined as string | undefined }));
  return (
    <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
      {markets.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => (
            <div key={market.name} className="luxury-card p-5 text-left">
              <p className="font-semibold text-navy">{market.name}</p>
              {market.detail ? <p className="mt-1 text-sm text-charcoal/70">{market.detail}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyContentPlaceholder message="Add local markets in the section editor." />
      )}
    </SectionShell>
  );
}

function WorkflowView({ content, strictContent }: { content: Record<string, unknown>; strictContent?: boolean }) {
  const data = parseModularSectionContent("workflow", content);
  return (
    <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
      {strictContent ? (
        <EmptyContentPlaceholder message="Workflow steps load from the database when step IDs are assigned." />
      ) : (
        <FieldExecutionTimeline steps={FIELD_EXECUTION_STEPS} />
      )}
    </SectionShell>
  );
}

function DocumentationSystemsView({ content, strictContent }: { content: Record<string, unknown>; strictContent?: boolean }) {
  const data = parseModularSectionContent("documentation_systems", content);
  return (
    <SectionShell eyebrow={data.eyebrow} headline={data.headline} lead={data.lead}>
      {strictContent ? (
        <EmptyContentPlaceholder message="Documentation features load from the database when feature IDs are assigned." />
      ) : (
        <DocumentationSuite items={OPERATIONAL_PROOF} />
      )}
    </SectionShell>
  );
}

function CtaSectionView({ content }: { content: Record<string, unknown> }) {
  const data = parseModularSectionContent("cta_v2", content);
  return (
    <section className={`py-16 md:py-24 ${data.gradientBg ? "section-band-dark" : "section-band-light"}`}>
      <div className="mx-auto max-w-2xl text-center">
        {data.eyebrow ? <p className="section-eyebrow text-aqua/90">{data.eyebrow}</p> : null}
        <h2 className="section-title mt-4 text-cream">{data.headline}</h2>
        <p className="section-lead text-silver/90">{data.body}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href={data.primaryCta.href} className="btn-hero-primary min-h-[52px]">{data.primaryCta.label}</Link>
          {data.showPhone ? (
            <a href={PHONE_TEL} className="btn-hero-secondary min-h-[52px]">Call {PHONE_DISPLAY}</a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
