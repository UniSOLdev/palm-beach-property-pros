import convert from "heic-convert";
import sharp from "sharp";
import { ReceiptScanError } from "@/lib/receipt/errors";

export const OCR_MAX_WIDTH = 2200;
export const OCR_JPEG_QUALITY = 88;
export const THUMBNAIL_WIDTH = 300;
export const THUMBNAIL_QUALITY = 72;

const HEIC_MIMES = new Set(["image/heic", "image/heif"]);

export type NormalizedReceiptAssets = {
  ocr: Buffer;
  thumbnail: Buffer;
  width: number;
  height: number;
  wasHeic: boolean;
};

async function decodeToRgbBuffer(input: Buffer, mime: string): Promise<{ buffer: Buffer; wasHeic: boolean }> {
  let buffer = input;
  let wasHeic = false;
  if (HEIC_MIMES.has(mime)) {
    wasHeic = true;
    try {
      const converted = await convert({
        buffer: buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer,
        format: "JPEG",
        quality: 0.92,
      });
      buffer = Buffer.from(converted as ArrayBuffer);
    } catch {
      throw new ReceiptScanError(
        "IMAGE_PROCESS",
        "Could not convert iPhone photo (HEIC). Try again or save as JPEG.",
        422,
      );
    }
  }
  return { buffer, wasHeic };
}

/** Light trim of uniform borders; ignores failures. */
async function tryTrimWhitespace(pipeline: sharp.Sharp): Promise<sharp.Sharp> {
  try {
    return pipeline.trim({ threshold: 12 });
  } catch {
    return pipeline;
  }
}

/** Production OCR image: rotate, trim, enhance, resize, progressive JPEG. */
export async function buildOcrImage(input: Buffer, mime: string): Promise<NormalizedReceiptAssets> {
  const { buffer, wasHeic } = await decodeToRgbBuffer(input, mime);
  try {
    let pipeline = sharp(buffer, { failOn: "none" }).rotate();
    pipeline = await tryTrimWhitespace(pipeline);
    pipeline = pipeline
      .resize({ width: OCR_MAX_WIDTH, withoutEnlargement: true, fit: "inside" })
      .normalize()
      .sharpen({ sigma: 0.8 })
      .jpeg({
        quality: OCR_JPEG_QUALITY,
        progressive: true,
        mozjpeg: true,
      });

    const ocr = await pipeline.toBuffer();
    const thumb = await sharp(ocr)
      .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true, fit: "inside" })
      .jpeg({ quality: THUMBNAIL_QUALITY, mozjpeg: true })
      .toBuffer();
    const meta = await sharp(ocr).metadata();

    return {
      ocr,
      thumbnail: thumb,
      width: meta.width ?? OCR_MAX_WIDTH,
      height: meta.height ?? 0,
      wasHeic,
    };
  } catch {
    throw new ReceiptScanError("IMAGE_PROCESS", "Could not prepare receipt image for scanning.", 422);
  }
}

/** Grayscale + higher contrast variant for low-confidence OCR retry. */
export async function buildGrayscaleOcrVariant(ocrJpeg: Buffer): Promise<Buffer> {
  return sharp(ocrJpeg, { failOn: "none" })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1.2 })
    .jpeg({ quality: OCR_JPEG_QUALITY, progressive: true, mozjpeg: true })
    .toBuffer();
}
