import type sharp from "sharp";

/**
 * Restrained editorial pass for PBPP media.
 * Goal: natural, expensive, believable — not HDR, not oversaturated, not AI-polished.
 */
export function applyEditorialGrade(pipeline: sharp.Sharp): sharp.Sharp {
  return pipeline
    .rotate()
    .modulate({
      brightness: 1.015,
      saturation: 0.97,
    })
    .linear(1.025, -3)
    .sharpen({
      sigma: 0.5,
      m1: 0.4,
      m2: 0.25,
      x1: 2,
      y2: 8,
      y3: 16,
    });
}

/** Detect likely over-processed / unrealistic color in source stats. */
export function naturalColorPenalty(channelMeans: number[], stdev: number): number {
  const [r = 128, g = 128, b = 128] = channelMeans;
  let penalty = 0;

  if (g > r * 1.18 && g > b * 1.12) penalty += 12;
  if (stdev > 72) penalty += 8;
  if (r > 230 && g > 230 && b > 230) penalty += 6;

  return penalty;
}

/** Prefer naturally lit, editorial frames — not crushed shadows or blown highlights. */
export function exposureBalanceScore(brightness: number, stdev: number): number {
  if (brightness >= 70 && brightness <= 175 && stdev >= 22 && stdev <= 58) return 20;
  if (brightness >= 55 && brightness <= 195 && stdev >= 18 && stdev <= 65) return 12;
  if (brightness < 35 || brightness > 215) return -14;
  return 4;
}
