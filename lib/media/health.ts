import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { MANIFEST_PATH } from "@/lib/media-curation/constants";
import type { CuratedManifest } from "@/lib/media-curation/types";

export type MediaHealthIssue = {
  kind: "missing_file" | "empty_src" | "unsupported_format" | "missing_pair" | "orphan_hint";
  path: string;
  detail: string;
};

export type MediaHealthReport = {
  generatedAt: string;
  manifestPath: string;
  manifestLoaded: boolean;
  totalPublicMediaFiles: number;
  referencedPaths: number;
  missingFiles: string[];
  emptySources: string[];
  unsupportedFormats: string[];
  missingPairings: string[];
  orphanFiles: string[];
  issues: MediaHealthIssue[];
  ok: boolean;
};

const SUPPORTED_IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".svg"]);
const SUPPORTED_VIDEO_EXT = new Set([".mp4", ".webm", ".mov"]);

function collectSrcRefs(value: unknown, refs: Set<string>) {
  if (!value || typeof value !== "object") return;
  if (typeof (value as { src?: unknown }).src === "string") {
    const src = (value as { src: string }).src;
    if (src.startsWith("/")) refs.add(src);
  }
  if (typeof (value as { poster?: unknown }).poster === "string") {
    const poster = (value as { poster: string }).poster;
    if (poster.startsWith("/")) refs.add(poster);
  }
  for (const nested of Object.values(value)) collectSrcRefs(nested, refs);
}

function extname(src: string): string {
  return path.extname(src.split("?")[0] ?? src).toLowerCase();
}

export function publicFilePath(src: string): string {
  return path.join(process.cwd(), "public", src.replace(/^\//, ""));
}

export function fileExistsForPublicSrc(src: string): boolean {
  if (!src.startsWith("/")) return true;
  return existsSync(publicFilePath(src));
}

export async function loadManifestForHealth(): Promise<CuratedManifest | null> {
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    return JSON.parse(raw) as CuratedManifest;
  } catch {
    return null;
  }
}

export async function buildMediaHealthReport(options?: {
  scanPublicMedia?: boolean;
}): Promise<MediaHealthReport> {
  const manifest = await loadManifestForHealth();
  const referenced = new Set<string>();
  const missingFiles: string[] = [];
  const emptySources: string[] = [];
  const unsupportedFormats: string[] = [];
  const missingPairings: string[] = [];
  const issues: MediaHealthIssue[] = [];

  if (manifest) collectSrcRefs(manifest, referenced);

  for (const src of referenced) {
    if (!src.trim()) {
      emptySources.push(src);
      issues.push({ kind: "empty_src", path: src, detail: "Empty media src in manifest" });
      continue;
    }

    const ext = extname(src);
    if (!SUPPORTED_IMAGE_EXT.has(ext) && !SUPPORTED_VIDEO_EXT.has(ext)) {
      unsupportedFormats.push(src);
      issues.push({ kind: "unsupported_format", path: src, detail: `Unsupported extension ${ext || "(none)"}` });
    }

    if (!fileExistsForPublicSrc(src)) {
      missingFiles.push(src);
      issues.push({ kind: "missing_file", path: src, detail: "Referenced file not found on disk" });
    }
  }

  if (manifest?.projects) {
    for (const project of manifest.projects) {
      for (const pair of project.beforeAfter ?? []) {
        if (!pair.before?.src || !pair.after?.src) {
          missingPairings.push(pair.id);
          issues.push({
            kind: "missing_pair",
            path: pair.id,
            detail: "Before/after pair missing src on one side",
          });
        }
      }
    }
  }

  let totalPublicMediaFiles = 0;
  let orphanFiles: string[] = [];

  if (options?.scanPublicMedia !== false) {
    const { readdirSync, statSync } = await import("fs");
    const mediaRoot = path.join(process.cwd(), "public/media");
    const files: string[] = [];

    function walk(dir: string) {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else files.push(full);
      }
    }
    walk(mediaRoot);
    totalPublicMediaFiles = files.length;

    orphanFiles = files
      .map((f) => "/" + path.relative(path.join(process.cwd(), "public"), f).split(path.sep).join("/"))
      .filter((publicPath) => {
        if (publicPath.endsWith("metadata.json") || publicPath.endsWith("metadata.example.json")) return false;
        if (publicPath.endsWith("manifest.json") || publicPath.endsWith("blur-map.json")) return false;
        if (publicPath.includes("/before/") || publicPath.includes("/after/") || publicPath.includes("/videos/")) {
          return false;
        }
        return !referenced.has(publicPath);
      })
      .slice(0, 50);
  }

  return {
    generatedAt: new Date().toISOString(),
    manifestPath: MANIFEST_PATH,
    manifestLoaded: Boolean(manifest),
    totalPublicMediaFiles,
    referencedPaths: referenced.size,
    missingFiles,
    emptySources,
    unsupportedFormats,
    missingPairings,
    orphanFiles,
    issues,
    ok: Boolean(manifest) && missingFiles.length === 0 && emptySources.length === 0,
  };
}

export function logMediaHealth(report: MediaHealthReport) {
  const payload = {
    ok: report.ok,
    referenced: report.referencedPaths,
    missing: report.missingFiles.length,
    manifestLoaded: report.manifestLoaded,
  };

  if (report.ok) {
    console.info("[PBPP Media Health]", JSON.stringify(payload));
    return;
  }

  console.warn("[PBPP Media Health]", JSON.stringify({ ...payload, missingFiles: report.missingFiles.slice(0, 10) }));
  for (const issue of report.issues.slice(0, 20)) {
    console.warn("[PBPP Media Missing]", JSON.stringify(issue));
  }
}

export async function assertMediaReady(): Promise<MediaHealthReport> {
  const report = await buildMediaHealthReport();
  logMediaHealth(report);
  return report;
}
