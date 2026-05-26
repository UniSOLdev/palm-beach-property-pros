import sharp from "sharp";
import convert from "heic-convert";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { MediaUploadError } from "@/lib/admin/media-errors";

export const MEDIA_LIBRARY_BUCKET = "media-library" as const;
export const MEDIA_MAX_BYTES = 20 * 1024 * 1024;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const VIDEO_MIMES = new Set(["video/mp4", "video/quicktime"]);

const SUPPORTED_LABEL = "JPG, PNG, WebP, HEIC, MP4, or MOV";

export function normalizeMediaMime(type: string, fileName: string): string {
  const t = type?.toLowerCase() || "";
  if (IMAGE_MIMES.has(t) || VIDEO_MIMES.has(t)) return t;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "heic" || ext === "heif") return "image/heic";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "mp4") return "video/mp4";
  if (ext === "mov") return "video/quicktime";
  return t || "application/octet-stream";
}

export function validateMediaUpload(file: { name: string; size: number; type: string }): {
  mime: string;
  fileType: "image" | "video";
} {
  if (!file.name?.trim()) {
    throw new MediaUploadError("VALIDATION", "File name is required.");
  }
  if (file.size <= 0) {
    throw new MediaUploadError("VALIDATION", "File is empty.");
  }
  if (file.size > MEDIA_MAX_BYTES) {
    throw new MediaUploadError("FILE_TOO_LARGE", `File must be under ${MEDIA_MAX_BYTES / (1024 * 1024)} MB.`);
  }

  const mime = normalizeMediaMime(file.type, file.name);
  if (VIDEO_MIMES.has(mime)) return { mime, fileType: "video" };
  if (IMAGE_MIMES.has(mime)) return { mime, fileType: "image" };

  throw new MediaUploadError("UNSUPPORTED_MIME", `Unsupported file type. Use ${SUPPORTED_LABEL}.`);
}

export function buildMediaStoragePath(folderPrefix: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const safePrefix = folderPrefix.replace(/[^a-zA-Z0-9/_-]/g, "") || "general";
  return `${safePrefix}/${crypto.randomUUID()}-original.${ext}`;
}

export function buildOptimizedStoragePath(originalPath: string): string {
  const dir = originalPath.includes("/") ? originalPath.slice(0, originalPath.lastIndexOf("/")) : "";
  const base = originalPath.split("/").pop()?.replace(/-original\.[^.]+$/, "") ?? crypto.randomUUID();
  return dir ? `${dir}/${base}-optimized.webp` : `${base}-optimized.webp`;
}

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
