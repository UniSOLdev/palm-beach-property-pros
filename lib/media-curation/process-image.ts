import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { WEB_IMAGE_WIDTHS } from "./constants";
import { applyEditorialGrade } from "./editorial-grade";
import type { CuratedImage, MediaRole, ScoredSourceImage } from "./types";

const BLUR_WIDTH = 16;

export async function processImageVariants(options: {
  source: ScoredSourceImage;
  projectId: string;
  role: MediaRole;
  alt: string;
  outputDir: string;
  publicBase: string;
}): Promise<CuratedImage> {
  const id = `${options.role}-${path.parse(options.source.fileName).name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const outName = `${id}.webp`;
  const outPath = path.join(options.outputDir, outName);

  await mkdir(options.outputDir, { recursive: true });

  const width = options.role === "hero" ? WEB_IMAGE_WIDTHS.hero : WEB_IMAGE_WIDTHS.gallery;

  const processed = await applyEditorialGrade(sharp(options.source.absolutePath, { failOn: "none" }))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 86, effort: 4, smartSubsample: true })
    .toFile(outPath);

  const blurBuffer = await sharp(outPath).resize(BLUR_WIDTH).webp({ quality: 40 }).toBuffer();

  const blurDataURL = `data:image/webp;base64,${blurBuffer.toString("base64")}`;
  const publicSrc = `${options.publicBase}/${outName}`;

  const focal =
    options.source.aspect >= 1.45
      ? "object-[center_38%]"
      : options.source.aspect >= 1.25
        ? "object-[center_42%]"
        : options.source.aspect < 0.95
          ? "object-[center_50%]"
          : "object-center";

  return {
    id,
    src: publicSrc,
    blurDataURL,
    width: processed.width,
    height: processed.height,
    aspect: processed.width / processed.height,
    alt: options.alt,
    score: options.source.score,
    role: options.role,
    storyPhase: options.source.storyPhase,
    focal,
    originalName: options.source.fileName,
  };
}

export async function writeBlurManifest(outputDir: string, images: CuratedImage[]) {
  const blurMap = Object.fromEntries(images.filter((i) => i.blurDataURL).map((i) => [i.src, i.blurDataURL]));
  await writeFile(path.join(outputDir, "blur-map.json"), JSON.stringify(blurMap, null, 2));
}
