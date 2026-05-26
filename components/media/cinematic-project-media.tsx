"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BeforeAfterCompare } from "@/components/media/before-after-compare";
import { MediaAssetImage } from "@/components/media/media-asset-image";
import { MediaFrame } from "@/components/media/media-frame";
import type { BeforeAfterPair, CuratedClip, CuratedImage, CuratedProject } from "@/lib/media-curation/types";
import type { MediaAsset } from "@/lib/media/types";

const EASE = [0.22, 1, 0.36, 1] as const;

function curatedToAsset(
  image: CuratedImage,
  category: MediaAsset["category"] = "transformation",
  overlay: MediaAsset["overlay"] = "card",
): MediaAsset {
  return {
    id: image.id,
    category,
    src: image.src,
    alt: image.alt,
    source: "authentic",
    focal: image.focal,
    blurDataURL: image.blurDataURL,
    aspect: image.role === "hero" ? "hero" : "landscape",
    overlay,
  };
}

export function FeaturedTransformation({ pair, title }: { pair: BeforeAfterPair; title?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      whileInView={reduce ? undefined : { opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <BeforeAfterCompare
        project={{
          before: curatedToAsset(pair.before, "transformation"),
          after: curatedToAsset(pair.after, "transformation"),
          isScaffold: false,
          title: title ?? pair.label,
        }}
      />
      <p className="mt-4 text-center text-sm text-charcoal/60">{pair.label}</p>
    </motion.div>
  );
}

export function BeforeAfterSlider({ pair }: { pair: BeforeAfterPair }) {
  return <FeaturedTransformation pair={pair} />;
}

export function ProjectGallery({ images, title }: { images: CuratedImage[]; title: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          initial={reduce ? false : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.7, delay: index * 0.04, ease: EASE }}
        >
          <MediaFrame aspect="landscape" className="image-frame">
            <MediaAssetImage asset={curatedToAsset(image, "exterior")} width={900} />
          </MediaFrame>
        </motion.div>
      ))}
      <p className="sr-only">{title}</p>
    </div>
  );
}

export function CinematicVideoHero({
  clip,
  poster,
  className = "",
}: {
  clip: CuratedClip | null;
  poster: CuratedImage | null;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (!clip && !poster) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden md:rounded-3xl ${className}`}>
      {clip ? (
        <video
          className="h-full w-full object-cover"
          autoPlay={!reduce}
          muted
          loop
          playsInline
          preload="metadata"
          poster={clip.poster}
          aria-hidden
        >
          <source src={clip.src} type="video/mp4" />
        </video>
      ) : poster ? (
        <MediaAssetImage asset={curatedToAsset(poster, "hero", "none")} width={2000} priority />
      ) : null}
      <div className="absolute inset-0 bg-black/20" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy/55 to-navy/15 md:rounded-3xl"
        aria-hidden
      />
      <div className="absolute inset-0 bg-luxury-vignette opacity-50 md:rounded-3xl" aria-hidden />
    </div>
  );
}

export function TransformationCarousel({ pairs }: { pairs: BeforeAfterPair[] }) {
  const reduce = useReducedMotion();
  if (pairs.length === 0) return null;

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {pairs.map((pair) => (
        <div key={pair.id} className="min-w-[min(100%,720px)] shrink-0 snap-center">
          <FeaturedTransformation pair={pair} />
        </div>
      ))}
    </div>
  );
}

export function RecentProjects({ projects }: { projects: CuratedProject[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <article key={project.id} className="luxury-card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-aqua-muted">{project.location}</p>
          <h3 className="mt-2 text-lg font-semibold text-navy">{project.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{project.summary}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map((tag) => (
              <li key={tag} className="rounded-full border border-navy/[0.08] bg-white/70 px-2.5 py-1 text-[11px] text-charcoal/65">
                {tag}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function ProjectReelGrid({ clips }: { clips: CuratedClip[] }) {
  const reduce = useReducedMotion();
  if (clips.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clips.map((clip) => (
        <div
          key={clip.id}
          className="group relative overflow-hidden rounded-2xl border border-navy/[0.08] bg-navy-deep shadow-card md:rounded-3xl"
        >
          <div className="aspect-[9/16] max-h-[420px] w-full">
            <video
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
              poster={clip.poster}
              onMouseEnter={(e) => {
                if (reduce) return;
                void e.currentTarget.play();
              }}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
              onTouchStart={(e) => {
                const el = e.currentTarget;
                if (el.paused) void el.play();
                else {
                  el.pause();
                  el.currentTime = 0;
                }
              }}
            >
              <source src={clip.src} type="video/mp4" />
            </video>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-deep/90 to-transparent p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-aqua/90">{clip.role.replace("-", " ")}</p>
            <p className="mt-1 text-sm text-cream/90">{clip.alt}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
