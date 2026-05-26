import type { MediaAspect, MediaAsset } from "./types";

const UNSPLASH_HOST = "images.unsplash.com";

/** Fallback when a local asset is missing or fails to load. */
export const MEDIA_UNAVAILABLE_PLACEHOLDER = "/brand/pbpp-wordmark-light.svg";

/** Build optimized remote image URLs with consistent editorial treatment. */
export function buildMediaUrl(src: string, width: number, quality = 78): string {
  if (!src?.trim()) return MEDIA_UNAVAILABLE_PLACEHOLDER;
  const normalized = src.replace("/media/.curated/", "/media/curated/");
  if (normalized.startsWith("/")) return normalized;
  if (!src.includes(UNSPLASH_HOST)) return src;

  const base = src.includes("?") ? src.split("?")[0]! : src;
  return `${base}?auto=format&fit=crop&w=${width}&q=${quality}&fm=webp`;
}

export function isLocalPublicSrc(src: string): boolean {
  return src.startsWith("/") && !src.startsWith("//");
}

export function resolveMedia(asset: MediaAsset, width: number): MediaAsset & { resolvedSrc: string } {
  return {
    ...asset,
    resolvedSrc: buildMediaUrl(asset.src, width),
  };
}

export function aspectClass(aspect: MediaAspect = "landscape"): string {
  switch (aspect) {
    case "hero":
      return "aspect-[16/10] sm:aspect-[21/9]";
    case "portrait":
      return "aspect-[3/4]";
    case "square":
      return "aspect-square";
    case "wide":
      return "aspect-[2/1]";
    case "landscape":
    default:
      return "aspect-[4/3]";
  }
}

export function sizesForAspect(aspect: MediaAspect = "landscape"): string {
  switch (aspect) {
    case "hero":
      return "100vw";
    case "portrait":
      return "(max-width: 1024px) 100vw, 320px";
    case "wide":
      return "(max-width: 1024px) 100vw, 66vw";
    default:
      return "(max-width: 1024px) 100vw, 50vw";
  }
}
