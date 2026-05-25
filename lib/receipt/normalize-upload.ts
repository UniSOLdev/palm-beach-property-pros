import type { NormalizedScanPage } from "@/lib/receipt/image-pipeline";
import { normalizeImageToScanPages } from "@/lib/receipt/image-pipeline";

/** Server-only: normalize HEIC/JPEG/PNG/WebP/PDF into OCR-ready page images. */
export async function normalizeUploadToScanImages(
  buffer: Buffer,
  mime: string,
): Promise<NormalizedScanPage[]> {
  if (mime === "application/pdf") {
    const { pdfToScanImages } = await import("@/lib/receipt/pdf-pipeline");
    const pages = await pdfToScanImages(buffer);
    return pages.map((page, i) => ({ ...page, pageIndex: i + 1 }));
  }
  return normalizeImageToScanPages(buffer, mime);
}
