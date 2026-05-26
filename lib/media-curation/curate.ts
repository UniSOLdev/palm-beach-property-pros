import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { CURATED_ROOT, CLIP_PRESETS, HOMEPAGE_CLIP, MANIFEST_PATH } from "./constants";
import { pairBeforeAfter, buildPairLabel, toBeforeAfterPair } from "./pair-images";
import { processImageVariants, writeBlurManifest } from "./process-image";
import {
  chooseClipStart,
  chooseHomepageClipDuration,
  findFfmpeg,
  generateVideoClip,
} from "./process-video";
import { classifyTopImages, dedupeImages } from "./score-image";
import { loadProjectMetadata, scanProjectMedia } from "./scanner";
import { buildStoryArc, pickHeroRestored, pickHomepageHeroClip } from "./story-arc";
import { generateSummary, inferDivision, inferTags, rankProject } from "./summarize-project";
import type { BeforeAfterPair, CuratedClip, CuratedImage, CuratedManifest, CuratedProject } from "./types";

export async function curateProject(projectId: string): Promise<CuratedProject | null> {
  const metadata = await loadProjectMetadata(projectId);
  const { images: rawImages, videos } = await scanProjectMedia(projectId);
  if (rawImages.length === 0 && videos.length === 0) return null;

  const images = dedupeImages(rawImages);
  const beforeImages = images.filter((i) => i.storyPhase === "neglected" || i.folder === "before");
  const afterImages = images.filter((i) => i.storyPhase === "restored" || i.folder === "after");
  const allAfter = afterImages.length > 0 ? afterImages : images.filter((i) => i.folder !== "before");

  const location = metadata.location ?? "Palm Beach County";
  const tags = inferTags(metadata, images);
  const division = inferDivision(metadata, tags) ?? "exterior";
  const summary = generateSummary(metadata, tags, location);
  const title = metadata.title ?? "Estate property restoration";

  const outputDir = path.join(CURATED_ROOT, projectId, "images");
  const clipsDir = path.join(CURATED_ROOT, projectId, "clips");
  const publicBase = `/media/curated/${projectId}/images`;
  const publicClipBase = `/media/curated/${projectId}/clips`;
  await mkdir(outputDir, { recursive: true });
  await mkdir(clipsDir, { recursive: true });

  const { heroCandidates, detailShots, actionShots, gallery, neglected, restored } = classifyTopImages(
    allAfter.length ? [...beforeImages, ...allAfter] : images,
  );

  const rawPairs = pairBeforeAfter(beforeImages, allAfter, 4);
  const beforeAfter: BeforeAfterPair[] = [];

  for (let i = 0; i < rawPairs.length; i++) {
    const pair = rawPairs[i]!;
    const before = await processImageVariants({
      source: pair.before,
      projectId,
      role: "before",
      alt: `Before conditions — ${title}, ${location}`,
      outputDir,
      publicBase,
    });
    const after = await processImageVariants({
      source: pair.after,
      projectId,
      role: "after",
      alt: `Restored property — ${title}, ${location}`,
      outputDir,
      publicBase,
    });
    beforeAfter.push(toBeforeAfterPair(pair, before, after, buildPairLabel(i, location)));
  }

  async function mapImages(sources: typeof images, role: CuratedImage["role"], limit: number) {
    const out: CuratedImage[] = [];
    for (const source of sources.slice(0, limit)) {
      out.push(
        await processImageVariants({
          source,
          projectId,
          role,
          alt: `${title} — ${location}`,
          outputDir,
          publicBase,
        }),
      );
    }
    return out;
  }

  const heroSource = pickHeroRestored(allAfter.length ? allAfter : images);
  const curatedHero = heroSource
    ? [await processImageVariants({
        source: heroSource,
        projectId,
        role: "hero",
        alt: `Restored estate — ${title}, ${location}`,
        outputDir,
        publicBase,
      })]
    : await mapImages(heroCandidates, "hero", 3);

  const curatedGallery = await mapImages(gallery, "gallery", 8);
  const curatedDetail = await mapImages(detailShots, "detail", 4);
  const curatedAction = await mapImages(actionShots, "action", 4);
  const curatedNeglected = beforeAfter.length
    ? beforeAfter.map((p) => p.before)
    : await mapImages(neglected, "before", 3);
  const curatedRestored = beforeAfter.length
    ? beforeAfter.map((p) => p.after)
    : await mapImages(restored, "after", 3);

  const allCuratedImages = [
    ...beforeAfter.flatMap((p) => [p.before, p.after]),
    ...curatedHero,
    ...curatedGallery,
    ...curatedDetail,
    ...curatedAction,
  ];
  await writeBlurManifest(outputDir, allCuratedImages);

  const clips: CuratedClip[] = [];
  const ffmpeg = await findFfmpeg();
  if (ffmpeg && videos.length > 0) {
    const heroVideo = pickHomepageHeroClip(videos);
    const secondary = [...videos]
      .filter((v) => v.absolutePath !== heroVideo?.absolutePath)
      .sort((a, b) => b.score - a.score)
      .slice(0, 1);

    const clipCandidates = heroVideo ? [heroVideo, ...secondary] : secondary;

    for (let i = 0; i < clipCandidates.length; i++) {
      const video = clipCandidates[i]!;
      const isHero = i === 0 && !!heroVideo;
      const preset = isHero ? CLIP_PRESETS.heroLoop : CLIP_PRESETS.highlight;
      const clipName = isHero ? "hero-loop.mp4" : `clip-${i}.mp4`;
      const posterName = isHero ? "hero-loop-poster.jpg" : `clip-${i}-poster.jpg`;
      const clipPath = path.join(clipsDir, clipName);
      const posterPath = path.join(clipsDir, posterName);
      const startSec = chooseClipStart(video.durationSec);
      const clipDuration = isHero
        ? chooseHomepageClipDuration(video.durationSec)
        : Math.min(preset.durationSec, Math.max(6, video.durationSec - startSec));

      try {
        await generateVideoClip({
          ffmpegPath: ffmpeg.ffmpeg,
          inputPath: video.absolutePath,
          outputPath: clipPath,
          posterPath,
          durationSec: clipDuration,
          width: isHero ? HOMEPAGE_CLIP.width : preset.width,
          height: isHero ? HOMEPAGE_CLIP.height : preset.height,
          startSec,
          crf: preset.crf,
        });

        clips.push({
          id: `clip-${projectId}-${isHero ? "hero" : i}`,
          src: `${publicClipBase}/${clipName}`,
          poster: `${publicClipBase}/${posterName}`,
          width: isHero ? HOMEPAGE_CLIP.width : preset.width,
          height: isHero ? HOMEPAGE_CLIP.height : preset.height,
          durationSec: clipDuration,
          alt: isHero
            ? `Field work in progress — ${title}`
            : `${title} operational documentation`,
          score: video.score,
          role: isHero ? "hero-loop" : "highlight",
          originalName: video.fileName,
        });
      } catch (err) {
        console.warn(`  ⚠ clip skipped for ${video.fileName}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  const storyArc = buildStoryArc({
    neglected: curatedNeglected,
    restored: curatedRestored.length ? curatedRestored : curatedHero,
    activeWork: clips.filter((c) => c.role === "hero-loop" || c.role === "highlight"),
  });

  const topImageScore = Math.max(...allAfter.map((i) => i.score), ...images.map((i) => i.score), 0);

  return {
    id: projectId,
    title,
    summary,
    location,
    division,
    tags,
    rankedScore: rankProject({
      pairCount: beforeAfter.length,
      topImageScore,
      clipCount: clips.length,
      galleryCount: curatedGallery.length,
    }),
    timeframe: metadata.timeframe,
    scope: metadata.scope ?? tags,
    beforeAfter,
    gallery: curatedGallery,
    heroCandidates: curatedHero,
    detailShots: curatedDetail,
    actionShots: curatedAction,
    clips,
    storyArc,
  };
}

export async function buildManifest(projects: CuratedProject[]): Promise<CuratedManifest> {
  const ranked = [...projects].sort((a, b) => b.rankedScore - a.rankedScore);
  const top = ranked[0];

  const heroImage =
    top?.heroCandidates[0] ??
    top?.storyArc.restored[0] ??
    top?.beforeAfter[0]?.after ??
    null;
  const heroClip = top?.clips.find((c) => c.role === "hero-loop") ?? null;
  const featuredTransformation = top?.beforeAfter.sort((a, b) => b.contrastScore - a.contrastScore)[0] ?? null;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    hasAuthenticMedia: ranked.length > 0,
    projects: ranked,
    homepage: {
      heroImage,
      heroClip,
      featuredTransformation,
      featuredProjectIds: ranked.slice(0, 3).map((p) => p.id),
      storyArc: top?.storyArc ?? null,
    },
  };
}

export async function writeManifest(manifest: CuratedManifest): Promise<void> {
  await mkdir(CURATED_ROOT, { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export async function curateAllProjects(): Promise<CuratedManifest> {
  const { listProjectIds } = await import("./scanner");
  const projectIds = await listProjectIds();
  const projects: CuratedProject[] = [];

  console.log(`Found ${projectIds.length} project folder(s) in public/media/projects/`);

  for (const projectId of projectIds) {
    console.log(`\n▶ Curating ${projectId}...`);
    const curated = await curateProject(projectId);
    if (curated) {
      projects.push(curated);
      console.log(
        `  ✓ ${curated.beforeAfter.length} pairs · story arc ${curated.storyArc.neglected.length}/${curated.storyArc.activeWork.length}/${curated.storyArc.restored.length} · score ${curated.rankedScore}`,
      );
    } else {
      console.log("  ⚠ no usable media found");
    }
  }

  const manifest = await buildManifest(projects);
  await writeManifest(manifest);
  console.log(`\n✓ Manifest written to ${MANIFEST_PATH}`);
  return manifest;
}
