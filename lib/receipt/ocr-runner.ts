import { buildGrayscaleOcrVariant } from "@/lib/receipt/asset-pipeline";
import { toDataUrl } from "@/lib/receipt/image-pipeline";
import { mergeOcrResults } from "@/lib/receipt/ocr-merge";
import { runReceiptOcr, type OcrParseResult } from "@/lib/receipt/ocr";
import type { NormalizedScanPage } from "@/lib/receipt/image-pipeline";

const LOW_CONFIDENCE_RETRY = 0.45;

export async function ocrScanPages(pages: NormalizedScanPage[]): Promise<OcrParseResult> {
  const results: OcrParseResult[] = [];
  for (const page of pages) {
    results.push(await runReceiptOcr(toDataUrl(page.buffer, page.mime)));
  }
  let merged = mergeOcrResults(results);

  if (merged.confidence < LOW_CONFIDENCE_RETRY && pages[0]) {
    const gray = await buildGrayscaleOcrVariant(pages[0].buffer);
    const retry = await runReceiptOcr(toDataUrl(gray, "image/jpeg"));
    if (retry.confidence > merged.confidence) {
      merged = {
        ...retry,
        warnings: [...merged.warnings, "OCR improved using enhanced grayscale pass."],
      };
    } else {
      merged.warnings.push("Low confidence — verify amounts and vendor manually.");
    }
  }

  return merged;
}
