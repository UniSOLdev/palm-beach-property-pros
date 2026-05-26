#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "public/media/curated/manifest.json");
const PUBLIC_MEDIA = path.join(ROOT, "public/media");

const SUPPORTED = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".mp4", ".webm", ".mov"]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function collectRefs(value, refs) {
  if (!value || typeof value !== "object") return;
  if (typeof value.src === "string" && value.src.startsWith("/")) refs.add(value.src);
  if (typeof value.poster === "string" && value.poster.startsWith("/")) refs.add(value.poster);
  for (const v of Object.values(value)) collectRefs(v, refs);
}

function publicPath(src) {
  return path.join(ROOT, "public", src.replace(/^\//, ""));
}

let manifest = null;
try {
  manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
} catch (error) {
  console.error("Failed to load manifest:", error.message);
  process.exit(1);
}

const refs = new Set();
collectRefs(manifest, refs);

const missing = [];
const unsupported = [];
for (const src of refs) {
  const ext = path.extname(src.split("?")[0]).toLowerCase();
  if (!SUPPORTED.has(ext)) unsupported.push(src);
  if (!existsSync(publicPath(src))) missing.push(src);
}

const allFiles = walk(PUBLIC_MEDIA);
const publicPaths = allFiles.map((f) => "/" + path.relative(path.join(ROOT, "public"), f).split(path.sep).join("/"));
const orphans = publicPaths.filter((p) => {
  if (p.includes("/before/") || p.includes("/after/") || p.includes("/videos/")) return false;
  if (p.endsWith(".json")) return false;
  return !refs.has(p);
});

console.log("\nPBPP Media Health Report");
console.log("========================");
console.log(`Manifest: ${MANIFEST}`);
console.log(`Referenced paths: ${refs.size}`);
console.log(`Public media files: ${allFiles.length}`);
console.log(`Missing references: ${missing.length}`);
console.log(`Unsupported formats: ${unsupported.length}`);
console.log(`Orphan curated files (sample): ${orphans.filter((p) => p.includes("/curated/")).length}`);

if (missing.length) {
  console.log("\nMissing files:");
  missing.forEach((m) => console.log(`  ✗ ${m}`));
}

if (unsupported.length) {
  console.log("\nUnsupported formats:");
  unsupported.forEach((u) => console.log(`  ! ${u}`));
}

if (orphans.filter((p) => p.includes("/curated/")).length) {
  console.log("\nOrphan curated files (first 15):");
  orphans
    .filter((p) => p.includes("/curated/"))
    .slice(0, 15)
    .forEach((o) => console.log(`  ? ${o}`));
}

console.log(`\nStatus: ${missing.length === 0 ? "OK" : "BROKEN"}\n`);
process.exit(missing.length ? 1 : 0);
