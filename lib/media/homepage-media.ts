import type { CuratedClip, CuratedManifest, CuratedProject, StoryArc } from "@/lib/media-curation/types";
import type { ProjectRecap, TransformationProject } from "@/lib/media/types";
import {
  curatedHeroAsset,
  curatedHeroVideo,
  curatedToProjectRecaps,
  curatedToTransformationProjects,
  loadCuratedManifest,
} from "@/lib/media/curated";
import { assertMediaReady, fileExistsForPublicSrc } from "@/lib/media/health";
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

function resolveHeroSrc(manifest: CuratedManifest): string {
  const heroAsset = curatedHeroAsset(manifest);
  const candidate = heroAsset?.src ?? manifest.homepage.heroImage?.src ?? "";
  if (candidate && fileExistsForPublicSrc(candidate)) return candidate;
  if (candidate) {
    console.warn("[PBPP Media Render]", JSON.stringify({ level: "warn", src: candidate, message: "hero missing on disk" }));
  }
  return buildMediaUrl(MEDIA_REGISTRY.hero.primary.src, 2000);
}

export async function getHomepageMediaBundle(): Promise<HomepageMediaBundle> {
  const manifest = await loadCuratedManifest();

  if (manifest?.hasAuthenticMedia && manifest.projects.length > 0) {
    const health = await assertMediaReady();
    if (!health.ok) {
      console.warn(
        "[PBPP Media Render]",
        JSON.stringify({
          level: "warn",
          message: "curated manifest has missing files — falling back where needed",
          missing: health.missingFiles.length,
        }),
      );
    }

    const heroAsset = curatedHeroAsset(manifest);
    const heroClip = curatedHeroVideo(manifest);
    const allClips = manifest.projects.flatMap((p) => p.clips);
    const heroImageSrc = resolveHeroSrc(manifest);

    return {
      hasAuthenticMedia: manifest.hasAuthenticMedia && health.missingFiles.length === 0,
      transformations: curatedToTransformationProjects(manifest.projects),
      recaps: curatedToProjectRecaps(manifest.projects),
      heroImageSrc,
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
