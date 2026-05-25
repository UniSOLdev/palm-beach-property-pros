export const BULK_SCAN_BATCH_SIZE = 2;
export const BULK_SCAN_MAX_FILES = 25;
export const BULK_SCAN_MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "pdf", "heic", "heif"]);

export const BULK_ALLOWED_LABEL = "JPG, JPEG, PNG, WebP, HEIC, HEIF, PDF";

export function validateBulkReceiptFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size <= 0) return { ok: false, error: "File is empty." };
  if (file.size > BULK_SCAN_MAX_BYTES) return { ok: false, error: "File must be under 12 MB." };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, error: `Unsupported type (.${ext || "?"}). Use ${BULK_ALLOWED_LABEL}.` };
  }
  return { ok: true };
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isImagePreviewable(file: File): boolean {
  return !isPdfFile(file);
}

export { scanReceiptViaApiWithTimeout as scanReceiptViaApi } from "@/lib/receipt/bulk-scan-queue";
