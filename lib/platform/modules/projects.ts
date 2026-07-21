import type { BeforeAfterPair as CuratedBeforeAfterPair } from "@/lib/media-curation/types";
import type { HomepageMediaBundle } from "@/lib/media/homepage-media";
import type { ProjectRecap, TransformationProject, MediaAsset } from "@/lib/media/types";
import { buildBeforeAfterPairsFromProjectMedia } from "@/lib/platform/modules/gallery";
import {
  PROJECT_CATEGORY_LABELS,
  resolveMediaUrl,
  type ProjectCategory,
  type SiteMediaAsset,
  type SiteProject,
} from "@/lib/site-content/types";

const DIVISION_BY_CATEGORY: Record<string, TransformationProject["division"]> = {
  "window-detailing": "exterior",
  "pressure-washing": "exterior",
  "auto-detailing": "exterior",
  "estate-cleanup": "property-support",
  "property-maintenance": "property-support",
};

function divisionForProject(project: SiteProject): TransformationProject["division"] {
  for (const category of project.service_categories) {
    const division = DIVISION_BY_CATEGORY[category];
    if (division) return division;
  }
  return "property-support";
}

function toMediaAsset(
  asset: SiteMediaAsset | null | undefined,
  fallbackAlt: string,
  category: MediaAsset["category"] = "transformation",
): MediaAsset | null {
  const src = resolveMediaUrl(asset);
  if (!src) return null;
  return {
    id: asset!.id,
    category,
    src,
    alt: asset?.alt_text ?? fallbackAlt,
    source: "authentic",
    blurDataURL: asset?.blur_data_url ?? undefined,
    aspect: "landscape",
    overlay: "card",
  };
}

function scopeFromProject(project: SiteProject): string[] {
  if (project.long_description.trim()) {
    const lines = project.long_description
      .split(/\n+/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length) return lines.slice(0, 5);
  }
  return project.service_categories.map(
    (category) => PROJECT_CATEGORY_LABELS[category as ProjectCategory] ?? category,
  );
}

export function siteProjectToRecap(project: SiteProject): ProjectRecap {
  const cover =
    toMediaAsset(
      project.cover_media ??
        project.media?.find((item) => item.gallery_phase === "after")?.media ??
        project.media?.[0]?.media,
      project.title,
      "documentation",
    ) ?? {
      id: project.id,
      category: "documentation",
      src: project.cover_image_url ?? "/media/curated/estate-cleanup-001/images/after-img-7714.webp",
      alt: project.title,
      source: "authentic",
      aspect: "landscape",
      overlay: "card",
    };

  return {
    id: project.id,
    title: project.title,
    location: project.city ?? "Palm Beach County",
    division: divisionForProject(project),
    duration: project.completion_date
      ? new Date(project.completion_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "Recent project",
    handled: scopeFromProject(project),
    image: cover,
    isScaffold: false,
    slug: project.slug,
    projectHref: `/projects/${project.slug}`,
  };
}

export function siteProjectToTransformation(project: SiteProject): TransformationProject | null {
  const pairs = buildBeforeAfterPairsFromProjectMedia(project.media ?? [], project.title);
  const first = pairs[0];
  if (!first) return null;

  const before = toMediaAsset(
    { id: first.before.src, file_url: first.before.src, alt_text: first.before.alt } as SiteMediaAsset,
    first.before.alt,
  );
  const after = toMediaAsset(
    { id: first.after.src, file_url: first.after.src, alt_text: first.after.alt } as SiteMediaAsset,
    first.after.alt,
  );
  if (!before || !after) return null;

  return {
    id: project.id,
    title: project.title,
    location: project.city ?? "Palm Beach County",
    division: divisionForProject(project),
    timeframe: project.completion_date ? "Completed project" : "Recent field work",
    summary: project.short_summary,
    scope: scopeFromProject(project),
    before,
    after,
    isScaffold: false,
  };
}

export function siteProjectToCuratedPairs(project: SiteProject): CuratedBeforeAfterPair[] {
  const pairs = buildBeforeAfterPairsFromProjectMedia(project.media ?? [], project.title);
  return pairs.map((pair, index) => ({
    id: pair.id,
    before: {
      id: `${pair.id}-before`,
      src: pair.before.src,
      width: pair.before.width ?? 1400,
      height: pair.before.height ?? 1050,
      aspect: (pair.before.width ?? 1400) / (pair.before.height ?? 1050),
      alt: pair.before.alt,
      score: 80,
      role: "before",
      originalName: pair.before.alt,
      blurDataURL: undefined,
    },
    after: {
      id: `${pair.id}-after`,
      src: pair.after.src,
      width: pair.after.width ?? 1400,
      height: pair.after.height ?? 1050,
      aspect: (pair.after.width ?? 1400) / (pair.after.height ?? 1050),
      alt: pair.after.alt,
      score: 80,
      role: "after",
      originalName: pair.after.alt,
      blurDataURL: undefined,
    },
    contrastScore: 90 - index,
    label: pair.caption ?? project.title,
  }));
}

export function mergeDbProjectsIntoHomepageMedia(
  projects: SiteProject[],
  manifestMedia: HomepageMediaBundle,
): HomepageMediaBundle {
  if (!projects.length) return manifestMedia;

  const recaps = projects.map(siteProjectToRecap);
  const transformations = projects
    .map(siteProjectToTransformation)
    .filter((project): project is TransformationProject => project !== null);
  const featuredPairs = projects.flatMap(siteProjectToCuratedPairs);
  const heroProject = projects.find((project) => project.is_featured) ?? projects[0];
  const heroSrc =
    resolveMediaUrl(heroProject.cover_media) ??
    heroProject.cover_image_url ??
    manifestMedia.heroImageSrc;

  return {
    ...manifestMedia,
    hasAuthenticMedia: true,
    recaps: recaps.length ? recaps : manifestMedia.recaps,
    transformations: transformations.length ? transformations : manifestMedia.transformations,
    featuredPairs: featuredPairs.length ? featuredPairs : manifestMedia.featuredPairs,
    heroImageSrc: heroSrc,
    heroImageAlt: heroProject.title,
  };
}
