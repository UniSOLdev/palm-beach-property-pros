import "server-only";

import convert from "heic-convert";
import sharp from "sharp";
import { MediaUploadError } from "@/lib/admin/media-errors";
import { buildOptimizedStoragePath } from "@/lib/admin/media-upload";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";

export { MEDIA_LIBRARY_BUCKET } from "@/lib/admin/media-upload";

export type OptimizedImageResult = {
  buffer: Buffer;
  width: number;
  height: number;
  webpPath: string;
};

/** Convert image buffer to WebP. Throws MediaUploadError on failure. */
export async function convertImageToWebp(
  input: Buffer,
  mime: string,
  originalPath: string,
): Promise<OptimizedImageResult> {
  const webpPath = buildOptimizedStoragePath(originalPath);

  logPipelineInfo("media conversion start", {
    step: "convertImageToWebp",
    details: { mime, originalPath, webpPath },
  });

  try {
    let inputBuffer = input;

    if (mime === "image/heic" || mime === "image/heif") {
      const jpegBuffer = await convert({
        buffer: input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer,
        format: "JPEG",
        quality: 0.92,
      });
      inputBuffer = Buffer.from(jpegBuffer as ArrayBuffer);
    }

    const { data, info } = await sharp(inputBuffer, { failOn: "none" })
      .rotate()
      .resize({ width: 2400, withoutEnlargement: true })
      .webp({ quality: 86, effort: 4, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });

    logPipelineInfo("media conversion finish", {
      step: "convertImageToWebp",
      details: { webpPath, width: info.width, height: info.height, bytes: data.length },
    });

    return { buffer: data, width: info.width, height: info.height, webpPath };
  } catch (error) {
    logPipelineError("media conversion failed", error, {
      step: "convertImageToWebp",
      details: { mime, originalPath },
    });
    throw new MediaUploadError(
      "CONVERSION_FAILED",
      "WebP conversion failed. Your original file was saved.",
      422,
    );
  }
}

export function logMediaUpload(step: string, details: Record<string, unknown>) {
  logPipelineInfo(`media upload: ${step}`, { step, details });
}

export function logMediaUploadError(step: string, error: unknown, details: Record<string, unknown> = {}) {
  logPipelineError(`media upload: ${step}`, error, { step, details });
}
