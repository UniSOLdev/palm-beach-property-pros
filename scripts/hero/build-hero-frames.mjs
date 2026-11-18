#!/usr/bin/env node
/**
 * Build the scroll-driven hero image sequence.
 *
 *   npm run hero:build -- path/to/clip.mp4    # your real footage
 *   npm run hero:build -- clip.mp4 --frames 140 --quality 60
 *
 * Output (all committed, served statically with immutable caching):
 *   public/hero/<version>/d/NNN.webp   desktop frames, 16:9, 1600x900
 *   public/hero/<version>/m/NNN.webp   mobile frames, 9:16 center crop, 608x1080
 *   public/hero/<version>/poster-d.webp, poster-m.webp   (first frame, higher quality)
 *   lib/site/hero-manifest.json        read by components/site/scroll-hero.tsx
 *
 * Requires ffmpeg on PATH for video input (macOS: `brew install ffmpeg`).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("../..", import.meta.url).pathname);
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const input = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));

const FRAMES = flag("frames", 120);
const QUALITY = flag("quality", 58);
const DESKTOP = { width: 1600, height: 900 };
const MOBILE = { width: 608, height: 1080 };

const work = mkdtempSync(join(tmpdir(), "pbpp-hero-"));
const srcDir = join(work, "src");
mkdirSync(srcDir);


function sourceFromVideo(file) {
  const probe = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
  ]).toString().trim();
  const duration = Number(probe);
  if (!duration) throw new Error(`Could not read duration of ${file}`);
  const fps = FRAMES / duration;
  console.log(`Extracting ${FRAMES} frames from ${duration.toFixed(2)}s clip (${fps.toFixed(2)} fps)…`);
  execFileSync("ffmpeg", [
    "-v", "error", "-i", file,
    "-vf", `fps=${fps},scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080`,
    "-frames:v", String(FRAMES),
    join(srcDir, "%03d.png"),
  ], { stdio: "inherit" });
}

if (!input) {
  console.error("Usage: npm run hero:build -- path/to/clip.mp4  (see README → Hero footage)");
  process.exit(1);
}
if (!existsSync(input)) throw new Error(`File not found: ${input}`);
sourceFromVideo(input);

const files = readdirSync(srcDir).filter((f) => f.endsWith(".png")).sort();
const hash = createHash("sha1");
for (const f of files.slice(0, 3)) hash.update(f + Date.now());
const version = hash.digest("hex").slice(0, 8);

const heroRoot = join(root, "public", "hero");
// Replace any previous build so stale frames are never shipped.
rmSync(heroRoot, { recursive: true, force: true });
const outD = join(heroRoot, version, "d");
const outM = join(heroRoot, version, "m");
mkdirSync(outD, { recursive: true });
mkdirSync(outM, { recursive: true });

let bytesD = 0;
let bytesM = 0;
for (const [i, f] of files.entries()) {
  const name = `${String(i + 1).padStart(3, "0")}.webp`;
  const img = sharp(join(srcDir, f));
  const meta = await img.metadata();
  const d = await img.clone().resize(DESKTOP.width, DESKTOP.height, { fit: "cover" }).webp({ quality: QUALITY, effort: 5 }).toFile(join(outD, name));
  // Mobile: center 9:16 crop of the source, then resize.
  const cropW = Math.round((meta.height * 9) / 16);
  const left = Math.max(0, Math.round((meta.width - cropW) / 2));
  const m = await sharp(join(srcDir, f))
    .extract({ left, top: 0, width: Math.min(cropW, meta.width), height: meta.height })
    .resize(MOBILE.width, MOBILE.height, { fit: "cover" })
    .webp({ quality: QUALITY - 4, effort: 5 })
    .toFile(join(outM, name));
  bytesD += d.size;
  bytesM += m.size;
}

// Posters (= frame 1) at slightly higher quality: these are the LCP image and
// the static fallback for reduced-motion / slow connections.
const first = join(srcDir, files[0]);
const meta0 = await sharp(first).metadata();
await sharp(first).resize(DESKTOP.width, DESKTOP.height, { fit: "cover" }).webp({ quality: 72 }).toFile(join(heroRoot, version, "poster-d.webp"));
const cw = Math.round((meta0.height * 9) / 16);
await sharp(first)
  .extract({ left: Math.round((meta0.width - cw) / 2), top: 0, width: cw, height: meta0.height })
  .resize(MOBILE.width, MOBILE.height)
  .webp({ quality: 70 })
  .toFile(join(heroRoot, version, "poster-m.webp"));

// Open Graph / social share image from ~40% through the sequence (the drive).
const ogSrc = join(srcDir, files[Math.floor(files.length * 0.4)]);
await sharp(ogSrc).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 78, mozjpeg: true }).toFile(join(heroRoot, version, "og.jpg"));

const manifest = {
  mode: "sequence",
  version,
  frames: files.length,
  base: `/hero/${version}`,
  desktop: DESKTOP,
  mobile: MOBILE,
  builtAt: new Date().toISOString(),
};
writeFileSync(join(root, "lib", "site", "hero-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
rmSync(work, { recursive: true, force: true });

const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`Done: ${files.length} frames → public/hero/${version}`);
console.log(`  desktop total ${kb(bytesD)} (avg ${kb(bytesD / files.length)})`);
console.log(`  mobile  total ${kb(bytesM)} (avg ${kb(bytesM / files.length)})`);
