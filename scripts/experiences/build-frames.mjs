#!/usr/bin/env node
/**
 * Build a web frame sequence from rendered PNG frames (renders/_work/<scene>/NNN.png).
 *
 *   npm run experience:build -- --src renders/_work/pool-dive --name pool-dive --start 2 --end 150 --step 2
 *   npm run experience:build -- --src renders/_work/car-spin/clean --name car-spin --variant clean --start 1 --end 71 --step 2 --loop
 *
 * Output (committed, served statically):
 *   public/experiences/<name>/<version>[/<variant>]/{d,m}/NNN.webp
 *   public/experiences/<name>/<version>[/<variant>]/poster-{d,m}.webp
 *   lib/site/experiences/<name>.json   (manifest read by the players)
 *
 * d = desktop 1600x900 (q~60); m = mobile 9:16 centre crop 608x1080 (q~56).
 * Budget (docs/RENDER_PIPELINE.md): <= 6 MB desktop and <= 3 MB mobile per package.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const src = resolve(root, opt("src", ""));
const name = opt("name");
const variant = opt("variant", "");
const version = opt("version", "v1");
const start = Number(opt("start", 1));
const end = Number(opt("end", 9999));
const step = Number(opt("step", 1));
const qd = Number(opt("qd", 60));
const qm = Number(opt("qm", 56));
const loop = has("loop");
// Optional portrait renders for phones (same frame numbers); otherwise phones get a 9:16 centre crop.
// Poster (static fallback + first paint): "first" (default) or "last" frame.
const posterPick = opt("poster", "first");
// Film finish: soft highlight bloom + gentle vignette (pass --no-grade to skip).
const doGrade = !has("no-grade");
const bloom = Number(opt("bloom", 0.42));
const vig = Number(opt("vignette", 0.28));
const msrc = opt("msrc", "") ? resolve(root, opt("msrc", "")) : "";
if (!name || !existsSync(src)) {
  console.error("Usage: --src <frames dir> --name <package> [--variant v] [--start --end --step] [--loop]");
  process.exit(1);
}

const DESKTOP = { width: 1600, height: 900 };
const MOBILE = { width: 608, height: 1080 };
const pad = (n) => String(n).padStart(3, "0");

const picks = [];
for (let f = start; f <= end; f += step) {
  const p = join(src, `${pad(f)}.png`);
  if (existsSync(p)) picks.push(p);
  else console.warn(`  missing ${pad(f)}.png (skipped)`);
}
if (!picks.length) throw new Error("no frames found");

const pkgDir = join(root, "public", "experiences", name, version);
const outDir = variant ? join(pkgDir, variant) : pkgDir;
rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "d"), { recursive: true });
mkdirSync(join(outDir, "m"), { recursive: true });

async function encode(file, out, w, h, q, mobile) {
  if (mobile && msrc) file = join(msrc, basename(file));
  let img = sharp(file);
  if (mobile && !msrc) {
    const meta = await img.metadata();
    const cw = Math.round((meta.height * 9) / 16);
    img = img.extract({ left: Math.round((meta.width - cw) / 2), top: 0, width: cw, height: meta.height });
  }
  const base = await img.resize(w, h, { fit: "cover" }).removeAlpha().toColourspace("srgb").png().toBuffer();
  if (!doGrade) return sharp(base).webp({ quality: q, effort: 5 }).toFile(out);
  return sharp(base).composite(await finish(base, w, h)).webp({ quality: q, effort: 5 }).toFile(out);
}

/** Bloom from the brightest third of the image, screened back on; radial vignette multiplied. */
async function finish(base, w, h) {
  const glow = await sharp(base)
    .linear(3.0, -2.0 * 255)
    .blur(Math.max(1, Math.max(w, h) / 70))
    .linear(bloom, 0)
    .png()
    .toBuffer();
  const edge = Math.round(255 * (1 - vig));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="v" cx="50%" cy="48%" r="75%"><stop offset="55%" stop-color="#fff"/><stop offset="100%" stop-color="rgb(${edge},${edge},${edge})"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`;
  return [
    { input: glow, blend: "screen" },
    { input: Buffer.from(svg), blend: "multiply" },
  ];
}

let bytesD = 0;
let bytesM = 0;
for (const [i, file] of picks.entries()) {
  const n = `${pad(i + 1)}.webp`;
  bytesD += (await encode(file, join(outDir, "d", n), DESKTOP.width, DESKTOP.height, qd, false)).size;
  bytesM += (await encode(file, join(outDir, "m", n), MOBILE.width, MOBILE.height, qm, true)).size;
  if ((i + 1) % 10 === 0) process.stdout.write(`  ${i + 1}/${picks.length}\r`);
}
const posterSrc = posterPick === "last" ? picks[picks.length - 1] : picks[0];
await encode(posterSrc, join(outDir, "poster-d.webp"), DESKTOP.width, DESKTOP.height, 72, false);
await encode(posterSrc, join(outDir, "poster-m.webp"), MOBILE.width, MOBILE.height, 70, true);

const manifestPath = join(root, "lib", "site", "experiences", `${name}.json`);
mkdirSync(dirname(manifestPath), { recursive: true });
const prev = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const entry = { frames: picks.length, base: `/experiences/${name}/${version}${variant ? `/${variant}` : ""}`, bytes: { d: bytesD, m: bytesM } };
const manifest = variant
  ? { ...prev, version, loop, desktop: DESKTOP, mobile: MOBILE, variants: { ...(prev.version === version ? prev.variants : {}), [variant]: entry } }
  : { version, loop, desktop: DESKTOP, mobile: MOBILE, ...entry };
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

const mb = (n) => `${(n / 1048576).toFixed(2)} MB`;
console.log(`\n${name}${variant ? `/${variant}` : ""}: ${picks.length} frames  desktop ${mb(bytesD)}  mobile ${mb(bytesM)}`);
