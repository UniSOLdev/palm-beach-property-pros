import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";
import { ReceiptScanError } from "@/lib/receipt/errors";
import type { ProcessedReceiptImage } from "@/lib/receipt/image-pipeline";

export const MAX_PDF_PAGES = 6;
const PDF_RENDER_SCALE = 2;
const JPEG_QUALITY = 85;
const MAX_WIDTH = 2000;

/** Render PDF pages to JPEG buffers optimized for OCR. */
export async function pdfToScanImages(pdfBuffer: Buffer): Promise<ProcessedReceiptImage[]> {
  const data = new Uint8Array(pdfBuffer);

  let doc;
  try {
    doc = await pdfjs.getDocument({
      data,
      useSystemFonts: true,
      useWorkerFetch: false,
    }).promise;
  } catch {
    throw new ReceiptScanError(
      "IMAGE_PROCESS",
      "Could not read PDF. Ensure the file is not password-protected.",
      422,
    );
  }

  const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);
  const pages: ProcessedReceiptImage[] = [];

  if (doc.numPages > MAX_PDF_PAGES) {
    console.info(
      "[PBPP Pipeline]",
      JSON.stringify({
        level: "info",
        message: `PDF truncated to ${MAX_PDF_PAGES} pages`,
        totalPages: doc.numPages,
      }),
    );
  }

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const ctx = canvas.getContext("2d");

      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;

      const pngBuffer = canvas.toBuffer("image/png");
      const optimized = await sharp(pngBuffer)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true, fit: "inside" })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
      const meta = await sharp(optimized).metadata();

      pages.push({
        buffer: optimized,
        mime: "image/jpeg",
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        wasHeic: false,
      });
    } catch (err) {
      console.error(
        "[PBPP Pipeline]",
        JSON.stringify({
          level: "error",
          message: "PDF page render failed",
          page: pageNum,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }

  if (!pages.length) {
    throw new ReceiptScanError(
      "IMAGE_PROCESS",
      "Could not render any PDF pages for scanning.",
      422,
    );
  }

  return pages;
}
