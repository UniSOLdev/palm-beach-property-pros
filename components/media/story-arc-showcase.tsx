"use client";

import { MediaAssetImage } from "@/components/media/media-asset-image";
import { MediaFrame } from "@/components/media/media-frame";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import type { StoryArc } from "@/lib/media-curation/types";
import type { MediaAsset } from "@/lib/media/types";

const PHASE_COPY = {
  neglected: {
    eyebrow: "Before conditions",
    title: "Overgrown & neglected",
    body: "Documented starting conditions—visibility, access, and scope baseline.",
  },
  "active-work": {
    eyebrow: "Field execution",
    title: "Active transformation",
    body: "Crews on site—clearing, refining, and restoring property lines.",
  },
  restored: {
    eyebrow: "Completed scope",
    title: "Clean & restored",
    body: "Open pathways, trimmed vegetation, and estate-ready presentation.",
  },
} as const;

function toAsset(
  image: StoryArc["neglected"][number],
  category: MediaAsset["category"] = "transformation",
): MediaAsset {
  return {
    id: image.id,
    category,
    src: image.src,
    alt: image.alt,
    source: "authentic",
    focal: image.focal,
    blurDataURL: image.blurDataURL,
    aspect: "landscape",
    overlay: "subtle",
  };
}

export function StoryArcShowcase({ storyArc }: { storyArc: StoryArc }) {
  const activeClip = storyArc.activeWork[0];

  return (
    <ScrollReveal>
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow text-ocean">Transformation arc</p>
          <h2 className="section-title mt-4">Neglected → active work → restored</h2>
          <p className="section-lead">
            The visual story owners and managers expect—obvious contrast, restored visibility, and
            calm operational proof.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3 lg:gap-6">
          <StoryPhaseColumn
            phase="neglected"
            image={storyArc.neglected[0]}
            fallbackImages={storyArc.neglected}
          />

          <article className="flex flex-col">
            <PhaseHeader phase="active-work" />
            <MediaFrame aspect="landscape" className="image-frame mt-5 flex-1 min-h-[220px]">
              {activeClip ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={activeClip.poster}
                >
                  <source src={activeClip.src} type="video/mp4" />
                </video>
              ) : storyArc.restored[1] ? (
                <MediaAssetImage asset={toAsset(storyArc.restored[1], "exterior")} width={900} />
              ) : (
                <div className="absolute inset-0 bg-cream-warm/80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/35 via-transparent to-transparent" aria-hidden />
            </MediaFrame>
          </article>

          <StoryPhaseColumn
            phase="restored"
            image={storyArc.restored[0]}
            fallbackImages={storyArc.restored}
          />
        </div>
      </section>
    </ScrollReveal>
  );
}

function PhaseHeader({ phase }: { phase: keyof typeof PHASE_COPY }) {
  const copy = PHASE_COPY[phase];
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua-muted">{copy.eyebrow}</p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-navy">{copy.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{copy.body}</p>
    </div>
  );
}

function StoryPhaseColumn({
  phase,
  image,
  fallbackImages,
}: {
  phase: "neglected" | "restored";
  image?: StoryArc["neglected"][number];
  fallbackImages: StoryArc["neglected"];
}) {
  const selected = image ?? fallbackImages[0];
  if (!selected) return null;

  return (
    <article className="flex flex-col">
      <PhaseHeader phase={phase} />
      <MediaFrame aspect="landscape" className="image-frame mt-5 min-h-[220px]">
        <MediaAssetImage asset={toAsset(selected)} width={900} />
      </MediaFrame>
    </article>
  );
}
