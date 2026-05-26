"use client";

import { CinematicVideoHero } from "@/components/media/cinematic-project-media";
import { HeroBackground } from "@/components/marketing/hero-background";
import type { CuratedClip, CuratedImage } from "@/lib/media-curation/types";

export function CuratedHeroMedia({
  heroImage,
  heroClip,
}: {
  heroImage: CuratedImage | null;
  heroClip: CuratedClip | null;
}) {
  if (heroClip || heroImage) {
    return <CinematicVideoHero clip={heroClip} poster={heroImage} />;
  }
  return null;
}

export function FallbackHeroMedia({ src, alt }: { src: string; alt: string }) {
  return <HeroBackground src={src} alt={alt} />;
}
