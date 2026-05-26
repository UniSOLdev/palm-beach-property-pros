import { extractImageNumber } from "./score-image";
import type { BeforeAfterPair, ScoredSourceImage } from "./types";
import { MIN_PAIR_SCORE } from "./constants";

function aspectSimilarity(a: ScoredSourceImage, b: ScoredSourceImage): number {
  const diff = Math.abs(a.aspect - b.aspect);
  if (diff <= 0.15) return 12;
  if (diff <= 0.35) return 6;
  return 0;
}

function numberProximity(a: ScoredSourceImage, b: ScoredSourceImage): number {
  const na = extractImageNumber(a.fileName);
  const nb = extractImageNumber(b.fileName);
  if (na == null || nb == null) return 0;
  const gap = Math.abs(na - nb);
  if (gap <= 20) return 10;
  if (gap <= 60) return 5;
  return 0;
}

export function pairBeforeAfter(
  beforeImages: ScoredSourceImage[],
  afterImages: ScoredSourceImage[],
  maxPairs = 4,
): Array<{ before: ScoredSourceImage; after: ScoredSourceImage; contrastScore: number }> {
  const pairs: Array<{ before: ScoredSourceImage; after: ScoredSourceImage; contrastScore: number }> = [];
  const usedBefore = new Set<string>();
  const usedAfter = new Set<string>();

  const candidates: Array<{ before: ScoredSourceImage; after: ScoredSourceImage; contrastScore: number }> = [];

  for (const after of afterImages) {
    for (const before of beforeImages) {
      const brightnessDelta = after.brightness - before.brightness;
      const wideContext =
        before.aspect >= 1.25 && after.aspect >= 1.25 ? 14 : before.aspect >= 1.15 && after.aspect >= 1.15 ? 8 : 0;
      const transformationProof = brightnessDelta >= 8 ? 12 : brightnessDelta >= 4 ? 6 : 0;

      const contrastScore =
        after.score * 0.4 +
        before.score * 0.22 +
        aspectSimilarity(before, after) +
        numberProximity(before, after) +
        wideContext +
        transformationProof +
        Math.min(Math.max(brightnessDelta * 0.06, -2), 8);

      candidates.push({ before, after, contrastScore });
    }
  }

  candidates.sort((a, b) => b.contrastScore - a.contrastScore);

  for (const candidate of candidates) {
    if (pairs.length >= maxPairs) break;
    if (usedBefore.has(candidate.before.absolutePath) || usedAfter.has(candidate.after.absolutePath)) continue;
    if (candidate.contrastScore < MIN_PAIR_SCORE) continue;
    usedBefore.add(candidate.before.absolutePath);
    usedAfter.add(candidate.after.absolutePath);
    pairs.push(candidate);
  }

  return pairs;
}

export function buildPairLabel(index: number, location: string): string {
  return `Neglected to restored · ${location}`;
}

export function toBeforeAfterPair(
  pair: { before: ScoredSourceImage; after: ScoredSourceImage; contrastScore: number },
  beforeImage: BeforeAfterPair["before"],
  afterImage: BeforeAfterPair["after"],
  label: string,
): BeforeAfterPair {
  return {
    id: `${beforeImage.id}__${afterImage.id}`,
    before: beforeImage,
    after: afterImage,
    contrastScore: Math.round(pair.contrastScore),
    label,
  };
}
