import type { CuratedClip, CuratedImage, ScoredSourceImage, ScoredSourceVideo, StoryArc, StoryPhase } from "./types";

/** Classify source media into the 3-act transformation arc. */
export function classifyStoryPhase(
  item: Pick<ScoredSourceImage, "folder" | "brightness" | "aspect"> | { folder: ScoredSourceVideo["folder"]; isVideo: true },
): StoryPhase {
  if ("isVideo" in item) return "active-work";
  if (item.folder === "before") return "neglected";
  if (item.folder === "after") return "restored";
  if (item.brightness < 85) return "neglected";
  return "restored";
}

/** Prefer spacious editorial frames — estate scale, pathways, context. */
export function spaciousnessBonus(aspect: number, width: number): number {
  if (aspect >= 1.55 && width >= 2500) return 16;
  if (aspect >= 1.35 && width >= 2000) return 12;
  if (aspect >= 1.25) return 8;
  if (aspect < 0.95) return -10;
  if (aspect < 1.1) return -4;
  return 0;
}

export function pickHeroRestored(candidates: ScoredSourceImage[]): ScoredSourceImage | null {
  const restored = candidates.filter((i) => i.storyPhase === "restored" || i.folder === "after");
  const ranked = [...restored].sort((a, b) => {
    const aWide = spaciousnessBonus(a.aspect, a.width) + a.score;
    const bWide = spaciousnessBonus(b.aspect, b.width) + b.score;
    return bWide - aWide;
  });
  return ranked[0] ?? null;
}

export function pickHomepageHeroClip(videos: ScoredSourceVideo[]): ScoredSourceVideo | null {
  const ranked = [...videos]
    .filter((v) => v.durationSec >= 4)
    .sort((a, b) => homepageClipScore(b) - homepageClipScore(a));
  return ranked[0] ?? null;
}

export function homepageClipScore(video: ScoredSourceVideo): number {
  const aspect = video.width / video.height;
  let score = video.score;

  if (video.durationSec >= 4 && video.durationSec <= 12) score += 18;
  else if (video.durationSec <= 25) score += 8;
  else score -= 10;

  if (aspect >= 1.3 && aspect <= 2.2) score += 14;
  else if (aspect < 0.72) score -= 16;

  if (/^IMG_\d+\.(mov|mp4)$/i.test(video.fileName)) score += 10;

  return score;
}

export function buildStoryArc(options: {
  neglected: CuratedImage[];
  restored: CuratedImage[];
  activeWork: CuratedClip[];
}): StoryArc {
  return {
    neglected: options.neglected.slice(0, 3),
    activeWork: options.activeWork.slice(0, 1),
    restored: options.restored.slice(0, 3),
  };
}
