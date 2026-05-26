import { readFile } from "fs/promises";
import { MANIFEST_PATH } from "../media-curation/constants";
import type { CuratedManifest, CuratedProject, BeforeAfterPair } from "../media-curation/types";
import type { MediaAsset, ProjectRecap, TransformationProject } from "./types";

let cachedManifest: CuratedManifest | null | undefined;

export async function loadCuratedManifest(): Promise<CuratedManifest | null> {
  if (cachedManifest !== undefined) return cachedManifest;
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    cachedManifest = JSON.parse(raw) as CuratedManifest;
    return cachedManifest;
  } catch {
    cachedManifest = null;
    return null;
  }
}

function curatedImageToAsset(
  image: { id: string; src: string; alt: string; focal?: string; role: string; blurDataURL?: string },
  category: MediaAsset["category"],
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
    overlay: image.role === "hero" ? "cinematic" : "card",
  };
}

export function curatedToTransformationProjects(projects: CuratedProject[]): TransformationProject[] {
  return projects.flatMap((project) =>
    project.beforeAfter.map((pair) => ({
      id: pair.id,
      title: project.title,
      location: project.location,
      division: project.division,
      timeframe: project.timeframe ?? "Documented field execution",
      summary: project.summary,
      scope: project.scope,
      isScaffold: false,
      before: curatedImageToAsset(pair.before, "transformation"),
      after: curatedImageToAsset(pair.after, "transformation"),
    })),
  );
}

export function curatedToProjectRecaps(projects: CuratedProject[]): ProjectRecap[] {
  return projects.slice(0, 3).map((project) => ({
    id: project.id,
    title: project.title,
    location: project.location,
    division:
      project.division === "exterior"
        ? "Exterior care"
        : project.division === "interior"
          ? "Interior care"
          : "Property support",
    duration: project.timeframe ?? "Documented program",
    handled: project.scope.slice(0, 4),
    isScaffold: false,
    image: curatedImageToAsset(project.gallery[0] ?? project.heroCandidates[0] ?? project.beforeAfter[0]!.after, project.division),
  }));
}

export function curatedFeaturedPair(manifest: CuratedManifest): BeforeAfterPair | null {
  return manifest.homepage.featuredTransformation;
}

export function curatedHeroAsset(manifest: CuratedManifest): MediaAsset | null {
  const hero = manifest.homepage.heroImage;
  if (!hero) return null;
  return curatedImageToAsset(hero, "hero");
}

export function curatedHeroVideo(manifest: CuratedManifest) {
  return manifest.homepage.heroClip;
}
