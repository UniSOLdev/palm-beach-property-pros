import { RECEIPT_BUCKETS, LEGACY_RECEIPT_BUCKETS } from "@/lib/receipt/buckets";
import { normalizeUploadToScanImages } from "@/lib/receipt/normalize-upload";
import { ocrScanPages } from "@/lib/receipt/ocr-runner";
import { normalizeReceiptMime } from "@/lib/receipt/image-pipeline";
import { uploadReceiptBuffers } from "@/lib/receipt/storage";
import { createServiceClient } from "@/lib/supabase/service";
import type { MigrationCandidate } from "@/lib/receipt/migration/discover";

export type MigrationProcessResult = {
  ok: boolean;
  skipped?: boolean;
  target_original_path?: string;
  target_optimized_path?: string;
  target_thumbnail_path?: string;
  error?: string;
  log?: string;
};

function inferMime(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "heic" || ext === "heif") return "image/heic";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function folderForCandidate(c: MigrationCandidate): string {
  if (c.expense_id) return `expenses/${c.expense_id}`;
  if (c.expense_receipt_id) return `expenses/pending/${c.expense_receipt_id}`;
  const match = c.source_path.match(/^expenses\/([^/]+)/);
  if (match) return `expenses/${match[1]}`;
  return "expenses/migrated";
}

export async function processMigrationCandidate(
  candidate: MigrationCandidate,
): Promise<MigrationProcessResult> {
  const supabase = createServiceClient();
  const bucketsToTry = [
    candidate.source_bucket,
    LEGACY_RECEIPT_BUCKETS.original,
    RECEIPT_BUCKETS.original,
  ];

  let raw: Buffer | null = null;
  let usedBucket = candidate.source_bucket;

  for (const bucket of bucketsToTry) {
    const { data, error } = await supabase.storage.from(bucket).download(candidate.source_path);
    if (!error && data) {
      raw = Buffer.from(await data.arrayBuffer());
      usedBucket = bucket;
      break;
    }
  }

  if (!raw) {
    return { ok: false, error: "Could not download source receipt from storage." };
  }

  const mime = inferMime(candidate.source_path);
  const normalizedMime = normalizeReceiptMime(mime, candidate.source_path);

  try {
    const pages = await normalizeUploadToScanImages(raw, normalizedMime);
    const ext = candidate.source_path.split(".").pop()?.toLowerCase() ?? "jpg";

    const uploaded = await uploadReceiptBuffers({
      pathPrefix: folderForCandidate(candidate),
      expenseId: candidate.expense_id,
      original: { buffer: raw, mime: normalizedMime, ext },
      optimizedPages: pages.map((p) => ({
        buffer: p.buffer,
        thumbnail: p.thumbnail,
        mime: p.mime,
        page: p.pageIndex,
      })),
    });

    let ocrNote = "";
    try {
      const ocr = await ocrScanPages(pages);
      ocrNote = `OCR confidence ${Math.round(ocr.confidence * 100)}%`;
    } catch {
      ocrNote = "OCR skipped during migration";
    }

    await updateLinkedRecords(candidate, uploaded, null);

    return {
      ok: true,
      target_original_path: uploaded.receipt_original_path,
      target_optimized_path: uploaded.receipt_optimized_path ?? undefined,
      target_thumbnail_path: uploaded.receipt_thumbnail_path ?? undefined,
      log: `Migrated from ${usedBucket}. ${ocrNote}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Migration processing failed";
    await updateLinkedRecords(candidate, null, message);
    return { ok: false, error: message };
  }
}

async function updateLinkedRecords(
  candidate: MigrationCandidate,
  uploaded: Awaited<ReturnType<typeof uploadReceiptBuffers>> | null,
  error: string | null,
) {
  const supabase = createServiceClient();
  const status = uploaded ? "completed" : "failed";
  const basePatch = uploaded
    ? {
        receipt_original_path: uploaded.receipt_original_path,
        receipt_storage_path: uploaded.receipt_original_path,
        receipt_optimized_path: uploaded.receipt_optimized_path,
        receipt_thumbnail_path: uploaded.receipt_thumbnail_path,
        receipt_url: uploaded.receipt_url,
        optimized_image_url: uploaded.optimized_image_url,
        receipt_processing_status: status,
        receipt_processed_at: new Date().toISOString(),
        receipt_processing_error: null,
        ocr_version: "openai-vision-v3",
        updated_at: new Date().toISOString(),
      }
    : {
        receipt_processing_status: status,
        receipt_processing_error: error,
        updated_at: new Date().toISOString(),
      };

  if (candidate.expense_id) {
    await supabase.from("expenses").update(basePatch).eq("id", candidate.expense_id);
  }
  if (candidate.expense_receipt_id) {
    await supabase.from("expense_receipts").update({
      ...basePatch,
      optimized_storage_path: uploaded?.receipt_optimized_path ?? null,
      receipt_thumbnail_url: uploaded?.thumbnail_url ?? null,
      normalized_paths: uploaded?.normalized_paths ?? [],
    }).eq("id", candidate.expense_receipt_id);
  }
}
