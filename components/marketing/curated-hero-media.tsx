"use client";

import { HeroBackground } from "@/components/marketing/hero-background";
import type { CuratedImage } from "@/lib/media-curation/types";

/** Hero uses a still photo only — video appears once in the story arc section. */
export function CuratedHeroMedia({ heroImage }: { heroImage: CuratedImage | null }) {
  if (!heroImage?.src) return null;
  return <HeroBackground src={heroImage.src} alt={heroImage.alt} />;
}

export function FallbackHeroMedia({
  src,
  alt,
  objectPosition,
}: {
  src: string;
  alt: string;
  objectPosition?: string;
}) {
  return <HeroBackground src={src} alt={alt} objectPosition={objectPosition} />;
}
