#!/usr/bin/env node
/**
 * Verify curated media is reachable on a deployed host.
 * Usage: node scripts/verify-media-deploy.mjs https://your-preview.vercel.app
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const sample = "/media/curated/estate-cleanup-001/images/after-img-7714.webp";

async function check(path) {
  const url = `${base}${path}`;
  const res = await fetch(url, { method: "HEAD" });
  return { url, ok: res.ok, status: res.status };
}

const home = await fetch(`${base}/`);
const homeHtml = await home.text();
const hasCuratedRefs = homeHtml.includes("/media/curated/");
const hasNewHero = homeHtml.includes("Property operations for Palm Beach County estates");
const asset = await check(sample);

console.log("\nPBPP media deploy verification");
console.log("Host:", base);
console.log("Homepage has curated refs:", hasCuratedRefs);
console.log("Homepage has new hero copy:", hasNewHero);
console.log("Sample asset:", asset.status, asset.ok ? "OK" : "MISSING", asset.url);
console.log("");

if (!hasCuratedRefs || !asset.ok) {
  console.error("FAIL — this deployment does not include the curated media homepage.");
  process.exit(1);
}

console.log("PASS — curated media homepage is deployed.\n");
