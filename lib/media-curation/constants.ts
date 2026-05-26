import path from "path";

export const PROJECTS_ROOT = path.join(process.cwd(), "public/media/projects");
export const CURATED_ROOT = path.join(process.cwd(), "public/media/.curated");
export const MANIFEST_PATH = path.join(CURATED_ROOT, "manifest.json");

export const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);
export const VIDEO_EXTENSIONS = new Set([".mov", ".mp4", ".m4v", ".webm"]);

export const PROJECT_SUBFOLDERS = ["before", "after", "videos", "drone"] as const;

export const WEB_IMAGE_WIDTHS = {
  thumb: 480,
  card: 960,
  gallery: 1400,
  hero: 2000,
} as const;

export const HOMEPAGE_CLIP = {
  minSec: 4,
  maxSec: 12,
  width: 1280,
  height: 720,
  crf: 23,
} as const;

export const CLIP_PRESETS = {
  heroLoop: { durationSec: 8, width: HOMEPAGE_CLIP.width, height: HOMEPAGE_CLIP.height, crf: HOMEPAGE_CLIP.crf },
  highlight: { durationSec: 12, width: 1280, height: 720, crf: 23 },
  reel: { durationSec: 12, width: 1280, height: 720, crf: 23 },
} as const;

export const MIN_IMAGE_SCORE = 35;
export const MIN_PAIR_SCORE = 55;
