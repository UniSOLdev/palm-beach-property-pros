import { createHash } from "crypto";
import { readFileSync } from "fs";
import sharp from "sharp";
import { exposureBalanceScore, naturalColorPenalty } from "./editorial-grade";
import { classifyStoryPhase, spaciousnessBonus } from "./story-arc";
import type { MediaRole, ScoredSourceImage } from "./types";

const IMAGE_NUMBER = /(?:IMG[_-]?)?(\d+)/i;

export function extractImageNumber(fileName: string): number | null {
  const match = fileName.match(IMAGE_NUMBER);
  return match ? Number(match[1]) : null;
}

function hashFile(path: string): string {
  const buf = readFileSync(path);
  return createHash("md5").update(buf.subarray(0, Math.min(buf.length, 65536))).digest("hex");
}

export async function scoreImage(
  absolutePath: string,
  relativePath: string,
  folder: ScoredSourceImage["folder"],
): Promise<ScoredSourceImage | null> {
  try {
    const pipeline = sharp(absolutePath, { failOn: "none" }).rotate();
    const [meta, stats] = await Promise.all([pipeline.metadata(), pipeline.stats()]);

    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width < 800 || height < 600) return null;

    const aspect = width / height;
    const channelMeans = stats.channels.map((c) => c.mean);
    const brightness = channelMeans[0] ?? 128;
    const stdev = stats.channels[0]?.stdev ?? 0;
    const storyPhase = classifyStoryPhase({ folder, brightness, aspect });

    let score = 0;
    score += Math.min(width / 45, 36);
    score += Math.min(stdev * 0.85, 16);
    score += exposureBalanceScore(brightness, stdev);
    score -= naturalColorPenalty(channelMeans, stdev);
    score += spaciousnessBonus(aspect, width);

    if (storyPhase === "neglected" && brightness < 120) score += 4;
    if (storyPhase === "restored" && brightness >= 75 && brightness <= 170) score += 6;

    if (width >= 3000) score += 5;

    const roles: MediaRole[] = [];
    if (aspect >= 1.35 && score >= 58 && storyPhase === "restored") roles.push("hero");
    if (folder === "before") roles.push("before");
    if (folder === "after") roles.push("after");
    if (score >= 52 && aspect >= 1.15) roles.push("gallery");
    if (stdev >= 26 && stdev <= 52 && aspect >= 1.05 && aspect < 1.35) roles.push("detail");
    if (storyPhase === "restored" && brightness >= 70) roles.push("action");

    return {
      absolutePath,
      relativePath,
      fileName: relativePath.split("/").pop() ?? relativePath,
      folder,
      width,
      height,
      aspect,
      brightness,
      sharpness: stdev,
      score: Math.round(Math.max(0, Math.min(100, score))),
      roles,
      storyPhase,
    };
  } catch {
    return null;
  }
}

export function dedupeImages(images: ScoredSourceImage[]): ScoredSourceImage[] {
  const seen = new Map<string, ScoredSourceImage>();
  for (const img of images.sort((a, b) => b.score - a.score)) {
    const key = `${img.width}x${img.height}:${hashFile(img.absolutePath).slice(0, 12)}`;
    const existing = seen.get(key);
    if (!existing || existing.score < img.score) seen.set(key, img);
  }
  return [...seen.values()].sort((a, b) => b.score - a.score);
}

export function classifyTopImages(images: ScoredSourceImage[]) {
  const restored = images.filter((i) => i.storyPhase === "restored");
  const neglected = images.filter((i) => i.storyPhase === "neglected");

  const heroCandidates = restored
    .filter((i) => i.roles.includes("hero") || (i.aspect >= 1.3 && i.score >= 55))
    .slice(0, 6);

  const detailShots = restored.filter((i) => i.roles.includes("detail")).slice(0, 4);
  const actionShots = images.filter((i) => i.roles.includes("action")).slice(0, 4);

  const gallery = [...neglected.slice(0, 2), ...restored.filter((i) => i.score >= 50)]
    .slice(0, 10);

  return { heroCandidates, detailShots, actionShots, gallery, neglected, restored };
}
