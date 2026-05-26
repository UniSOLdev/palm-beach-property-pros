#!/usr/bin/env node
import { cp, mkdir, readdir, writeFile } from "fs/promises";
import path from "path";

const PROJECTS_ROOT = path.join(process.cwd(), "public/media/projects");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);
const VIDEO_EXT = new Set([".mov", ".mp4", ".m4v", ".webm"]);

async function copyMedia(fromDir, toDir, filter) {
  await mkdir(toDir, { recursive: true });
  const entries = await readdir(fromDir, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!filter(ext)) continue;
    await cp(path.join(fromDir, entry.name), path.join(toDir, entry.name));
    count++;
  }
  return count;
}

async function main() {
  const projectId = process.argv[2] ?? "estate-cleanup-001";
  const beforeDir = process.argv[3] ?? path.join(process.env.HOME ?? "", "Desktop/BEFORE PHOTOS");
  const afterDir = process.argv[4] ?? path.join(process.env.HOME ?? "", "Desktop/AFTER PHOTOS");
  const videoDir = process.argv[5] ?? path.join(process.env.HOME ?? "", "Desktop/VIDEOS");

  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  await mkdir(projectRoot, { recursive: true });

  const beforeCount = await copyMedia(beforeDir, path.join(projectRoot, "before"), (ext) => IMAGE_EXT.has(ext));
  const afterCount = await copyMedia(afterDir, path.join(projectRoot, "after"), (ext) => IMAGE_EXT.has(ext));
  const videoCount = await copyMedia(videoDir, path.join(projectRoot, "videos"), (ext) => VIDEO_EXT.has(ext));

  const metadata = {
    title: "Estate vegetation cleanup & exterior restoration",
    location: "Palm Beach Gardens",
    division: "exterior",
    timeframe: "48-hour estate turnaround",
    tags: ["vegetation removal", "pathway clearing", "landscape refinement", "debris removal", "estate exterior"],
    scope: ["Vegetation trimming", "Debris removal", "Pathway clearing", "Landscape refinement", "Exterior reset"],
    summary:
      "Complete estate vegetation cleanup and exterior property restoration in Palm Beach Gardens featuring trimming, debris removal, pathway clearing, and landscape refinement.",
  };

  await writeFile(path.join(projectRoot, "metadata.json"), JSON.stringify(metadata, null, 2));

  console.log(`Imported project "${projectId}"`);
  console.log(`  before: ${beforeCount} files`);
  console.log(`  after:  ${afterCount} files`);
  console.log(`  videos: ${videoCount} files`);
  console.log("\nNext: npm run media:curate");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
