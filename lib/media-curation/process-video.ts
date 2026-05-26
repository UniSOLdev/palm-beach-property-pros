import { execFile } from "child_process";
import { promisify } from "util";
import { HOMEPAGE_CLIP } from "./constants";
import type { ScoredSourceVideo } from "./types";

const execFileAsync = promisify(execFile);

const OPERATIONAL_HINTS =
  /debris|vegetation|edge|edging|pressure|wash|walk|reveal|path|clear|trim|blow|restor|cleanup|pov|drone/i;

export async function findFfmpeg(): Promise<{ ffmpeg: string; ffprobe: string } | null> {
  const candidates = [
    { ffmpeg: "ffmpeg", ffprobe: "ffprobe" },
    { ffmpeg: "/opt/homebrew/bin/ffmpeg", ffprobe: "/opt/homebrew/bin/ffprobe" },
    { ffmpeg: "/usr/local/bin/ffmpeg", ffprobe: "/usr/local/bin/ffprobe" },
  ];

  for (const bin of candidates) {
    try {
      await execFileAsync(bin.ffprobe, ["-version"]);
      return bin;
    } catch {
      continue;
    }
  }
  return null;
}

export async function scoreVideo(
  absolutePath: string,
  relativePath: string,
  folder: ScoredSourceVideo["folder"],
  ffprobePath = "ffprobe",
): Promise<ScoredSourceVideo | null> {
  try {
    const { stdout } = await execFileAsync(ffprobePath, [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,duration",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      absolutePath,
    ]);

    const parsed = JSON.parse(stdout) as {
      streams?: Array<{ width?: number; height?: number; duration?: string }>;
      format?: { duration?: string };
    };

    const stream = parsed.streams?.[0];
    const width = stream?.width ?? 0;
    const height = stream?.height ?? 0;
    const durationSec = Number(stream?.duration ?? parsed.format?.duration ?? 0);
    if (!width || !height || durationSec < 2) return null;

    const fileName = relativePath.split("/").pop() ?? relativePath;
    const aspect = width / height;
    let score = 0;

    if (durationSec >= 4 && durationSec <= 12) score += 24;
    else if (durationSec >= 4 && durationSec <= 25) score += 12;
    else if (durationSec <= 90) score += 4;
    else score -= 14;

    score += width >= 1920 ? 12 : width >= 1280 ? 7 : 2;
    if (aspect >= 1.35 && aspect <= 2.2) score += 16;
    else if (aspect < 0.72) score -= 18;
    if (folder === "drone") score += 12;
    if (/^IMG_\d+\.(mov|mp4)$/i.test(fileName)) score += 14;
    if (OPERATIONAL_HINTS.test(relativePath)) score += 10;
    if (/mcp|pov|meta/i.test(relativePath)) score += 6;

    return {
      absolutePath,
      relativePath,
      fileName,
      folder,
      width,
      height,
      durationSec,
      score: Math.round(Math.min(100, Math.max(0, score))),
      hasAudio: false,
    };
  } catch {
    return null;
  }
}

/** Natural web export — trim, scale, very subtle tone pass only. No flashy effects. */
export async function generateVideoClip(options: {
  ffmpegPath: string;
  inputPath: string;
  outputPath: string;
  posterPath: string;
  durationSec: number;
  width: number;
  height: number;
  startSec?: number;
  crf?: number;
}): Promise<{ durationSec: number }> {
  const start = options.startSec ?? 0;
  const crf = options.crf ?? 23;
  const vf = [
    `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease`,
    `pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`,
    "eq=brightness=0.01:contrast=1.02:saturation=0.98",
    "format=yuv420p",
  ].join(",");

  await execFileAsync(options.ffmpegPath, [
    "-y",
    "-ss",
    String(start),
    "-t",
    String(options.durationSec),
    "-i",
    options.inputPath,
    "-an",
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    String(crf),
    "-movflags",
    "+faststart",
    options.outputPath,
  ]);

  await execFileAsync(options.ffmpegPath, [
    "-y",
    "-ss",
    String(start + Math.min(1.5, options.durationSec / 4)),
    "-i",
    options.inputPath,
    "-frames:v",
    "1",
    "-vf",
    vf,
    options.posterPath,
  ]);

  return { durationSec: options.durationSec };
}

/** Pick a calm in-point — skip cold open dead space, stay before long tail. */
export function chooseClipStart(durationSec: number): number {
  if (durationSec <= 12) return 0;
  if (durationSec <= 45) return Math.min(2, durationSec * 0.08);
  return Math.min(durationSec * 0.12, 6);
}

/** Homepage ambient loop — calm, 4–12s, landscape, no abrupt feel. */
export function chooseHomepageClipDuration(sourceDurationSec: number): number {
  const available = Math.max(4, sourceDurationSec - chooseClipStart(sourceDurationSec));
  return Math.round(
    Math.min(HOMEPAGE_CLIP.maxSec, Math.max(HOMEPAGE_CLIP.minSec, Math.min(available, 10))),
  );
}
