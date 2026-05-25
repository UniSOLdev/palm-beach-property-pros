import convert from "heic-convert";
import sharp from "sharp";
import { ReceiptScanError } from "@/lib/receipt/errors";

const MAX_WIDTH = 2000;
const MAX_BYTES = 12 * 1024 * 1024;
const JPEG_QUALITY = 85;

const HEIC_MIMES = new Set(["image/heic", "image/heif"]);
const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  ...HEIC_MIMES,
]);

export type ProcessedReceiptImage = {
  buffer: Buffer;
  mime: "image/jpeg";
  width: number;
  height: number;
  wasHeic: boolean;
};

export function normalizeReceiptMime(type: string, fileName: string): string {
  const t = type?.toLowerCase() || "";
  if (IMAGE_MIMES.has(t) || t === "application/pdf") return t;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "heic" || ext === "heif") return "image/heic";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";
  return t || "application/octet-stream";
}

const SUPPORTED_LABEL = "JPG, JPEG, PNG, WebP, HEIC, HEIF, or PDF";

export function validateReceiptUpload(file: { name: string; size: number; type: string }): void {
  if (!file.name?.trim()) throw new ReceiptScanError("VALIDATION", "File name is required.");
  if (file.size <= 0) throw new ReceiptScanError("VALIDATION", "File is empty.");
  if (file.size > MAX_BYTES) {
    throw new ReceiptScanError("VALIDATION", "Receipt must be under 12 MB.");
  }
  const mime = normalizeReceiptMime(file.type, file.name);
  if (mime === "application/pdf") return;
  if (!IMAGE_MIMES.has(mime)) {
    throw new ReceiptScanError("VALIDATION", `Unsupported file type. Use ${SUPPORTED_LABEL}.`);
  }
}

export type NormalizedScanPage = ProcessedReceiptImage & { pageIndex: number };

/** Normalize image uploads (not PDF) into OCR-ready JPEG. */
export async function normalizeImageToScanPages(
  buffer: Buffer,
  mime: string,
): Promise<NormalizedScanPage[]> {
  const processed = await processReceiptImage(buffer, mime);
  return [{ ...processed, pageIndex: 1 }];
}

export async function processReceiptImage(
  input: Buffer,
  mime: string,
): Promise<ProcessedReceiptImage> {
  let buffer = input;
  let wasHeic = false;

  if (HEIC_MIMES.has(mime)) {
    wasHeic = true;
    try {
      const converted = await convert({
        buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
        format: "JPEG",
        quality: 0.92,
      });
      buffer = Buffer.from(converted as ArrayBuffer);
    } catch (err) {
      throw new ReceiptScanError(
        "IMAGE_PROCESS",
        "Could not convert iPhone photo (HEIC). Try again or save as JPEG in Photos.",
        422,
      );
    }
  }

  try {
    const pipeline = sharp(buffer, { failOn: "none" }).rotate();
    const meta = await pipeline.metadata();
    const resized = pipeline.resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    });
    const optimized = await resized.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    const outMeta = await sharp(optimized).metadata();

    return {
      buffer: optimized,
      mime: "image/jpeg",
      width: outMeta.width ?? meta.width ?? MAX_WIDTH,
      height: outMeta.height ?? meta.height ?? 0,
      wasHeic,
    };
  } catch {
    throw new ReceiptScanError(
      "IMAGE_PROCESS",
      "Could not prepare receipt image for scanning.",
      422,
    );
  }
}

export function toDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
