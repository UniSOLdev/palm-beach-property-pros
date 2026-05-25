import { buildOcrImage } from "@/lib/receipt/asset-pipeline";
import { ReceiptScanError } from "@/lib/receipt/errors";

const MAX_BYTES = 12 * 1024 * 1024;

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
  thumbnail: Buffer;
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

/** Normalize image uploads (not PDF) into OCR-ready JPEG + thumbnail. */
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
  const assets = await buildOcrImage(input, mime);
  return {
    buffer: assets.ocr,
    thumbnail: assets.thumbnail,
    mime: "image/jpeg",
    width: assets.width,
    height: assets.height,
    wasHeic: assets.wasHeic,
  };
}

export function toDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
