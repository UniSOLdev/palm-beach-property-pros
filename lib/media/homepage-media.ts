import type { CuratedClip, CuratedManifest, CuratedProject, StoryArc } from "@/lib/media-curation/types";
import type { ProjectRecap, TransformationProject } from "@/lib/media/types";
import {
  curatedHeroAsset,
  curatedHeroVideo,
  curatedToProjectRecaps,
  curatedToTransformationProjects,
  loadCuratedManifest,
} from "@/lib/media/curated";
import { TRANSFORMATION_PROJECTS, PROJECT_RECAPS, MEDIA_REGISTRY } from "@/lib/media/registry";
import { buildMediaUrl } from "@/lib/media/resolve";

export type HomepageMediaBundle = {
  hasAuthenticMedia: boolean;
  transformations: TransformationProject[];
  recaps: ProjectRecap[];
  heroImageSrc: string;
  heroImageAlt: string;
  heroClip: CuratedClip | null;
  curatedHeroImage: CuratedManifest["homepage"]["heroImage"];
  featuredPairs: CuratedManifest["projects"][number]["beforeAfter"];
  galleryProjects: CuratedProject[];
  reelClips: CuratedClip[];
  storyArc: StoryArc | null;
};

export async function getHomepageMediaBundle(): Promise<HomepageMediaBundle> {
  const manifest = await loadCuratedManifest();

  if (manifest?.hasAuthenticMedia && manifest.projects.length > 0) {
    const heroAsset = curatedHeroAsset(manifest);
    const heroClip = curatedHeroVideo(manifest);
    const allClips = manifest.projects.flatMap((p) => p.clips);

    return {
      hasAuthenticMedia: true,
      transformations: curatedToTransformationProjects(manifest.projects),
      recaps: curatedToProjectRecaps(manifest.projects),
      heroImageSrc: heroAsset?.src ?? manifest.homepage.heroImage?.src ?? "",
      heroImageAlt: heroAsset?.alt ?? "Palm Beach Property Pros field documentation",
      heroClip,
      curatedHeroImage: manifest.homepage.heroImage,
      featuredPairs: manifest.projects.flatMap((p) => p.beforeAfter),
      galleryProjects: manifest.projects,
      reelClips: allClips.filter((c) => c.role !== "hero-loop").slice(0, 3),
      storyArc: manifest.homepage.storyArc,
    };
  }

  const hero = MEDIA_REGISTRY.hero.primary;
  return {
    hasAuthenticMedia: false,
    transformations: [...TRANSFORMATION_PROJECTS],
    recaps: [...PROJECT_RECAPS],
    heroImageSrc: buildMediaUrl(hero.src, 2000),
    heroImageAlt: hero.alt,
    heroClip: null,
    curatedHeroImage: null,
    featuredPairs: [],
    galleryProjects: [],
    reelClips: [],
    storyArc: null,
  };
}
