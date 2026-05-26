import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import { IMAGE_EXTENSIONS, PROJECTS_ROOT, PROJECT_SUBFOLDERS, VIDEO_EXTENSIONS } from "./constants";
import { scoreImage } from "./score-image";
import { findFfmpeg, scoreVideo } from "./process-video";
import type { ProjectMetadata, ScoredSourceImage, ScoredSourceVideo } from "./types";

async function listMediaFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => path.join(dir, e.name));
  } catch {
    return [];
  }
}

export async function listProjectIds(): Promise<string[]> {
  try {
    const entries = await readdir(PROJECTS_ROOT, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);
  } catch {
    return [];
  }
}

export async function loadProjectMetadata(projectId: string): Promise<ProjectMetadata> {
  const metaPath = path.join(PROJECTS_ROOT, projectId, "metadata.json");
  try {
    const raw = await readFile(metaPath, "utf8");
    return JSON.parse(raw) as ProjectMetadata;
  } catch {
    return {};
  }
}

export async function scanProjectMedia(projectId: string): Promise<{
  images: ScoredSourceImage[];
  videos: ScoredSourceVideo[];
}> {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  const images: ScoredSourceImage[] = [];
  const videos: ScoredSourceVideo[] = [];
  const bins = await findFfmpeg();

  for (const folder of PROJECT_SUBFOLDERS) {
    const folderPath = path.join(projectRoot, folder);
    const files = await listMediaFiles(folderPath);
    for (const absolutePath of files) {
      const ext = path.extname(absolutePath).toLowerCase();
      const relativePath = path.relative(projectRoot, absolutePath);

      if (IMAGE_EXTENSIONS.has(ext)) {
        const scored = await scoreImage(absolutePath, relativePath, folder === "drone" ? "drone" : folder);
        if (scored) images.push(scored);
      } else if (VIDEO_EXTENSIONS.has(ext) && bins) {
        const scored = await scoreVideo(
          absolutePath,
          relativePath,
          folder === "drone" ? "drone" : "videos",
          bins.ffprobe,
        );
        if (scored) videos.push(scored);
      }
    }
  }

  // Root-level drops (optional flat import)
  const rootFiles = await listMediaFiles(projectRoot);
  for (const absolutePath of rootFiles) {
    const ext = path.extname(absolutePath).toLowerCase();
    const relativePath = path.basename(absolutePath);
    if (IMAGE_EXTENSIONS.has(ext)) {
      const scored = await scoreImage(absolutePath, relativePath, "root");
      if (scored) images.push(scored);
    } else if (VIDEO_EXTENSIONS.has(ext) && bins) {
      const scored = await scoreVideo(absolutePath, relativePath, "root", bins.ffprobe);
      if (scored) videos.push(scored);
    }
  }

  return { images, videos };
}

export async function projectHasRawMedia(projectId: string): Promise<boolean> {
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  try {
    const s = await stat(projectRoot);
    return s.isDirectory();
  } catch {
    return false;
  }
}
