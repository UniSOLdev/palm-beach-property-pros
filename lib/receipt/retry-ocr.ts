import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { legacyOriginalBucketForPath } from "@/lib/receipt/buckets";
import { ReceiptScanError } from "@/lib/receipt/errors";
import { normalizeUploadToScanImages } from "@/lib/receipt/normalize-upload";
import { ocrScanPages } from "@/lib/receipt/ocr-runner";
import { suggestJobMatch, type JobMatchCandidate } from "@/lib/receipt/job-matching";
import { signReceiptAssets } from "@/lib/receipt/signed-urls";
import type { ReceiptScanResponse } from "@/lib/receipt/scan-types";
import { confidenceTier } from "@/lib/receipt/scan-types";

async function loadJobsForMatching(): Promise<JobMatchCandidate[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("id, service_type, address, job_date, status")
      .eq("archived", false)
      .order("job_date", { ascending: false })
      .limit(100);
    if (error) return [];
    return (data ?? []).map((j) => ({
      id: j.id,
      label: `${j.service_type} · ${j.address}`,
      service_type: j.service_type,
      address: j.address,
      job_date: j.job_date,
      status: j.status,
    }));
  } catch {
    return [];
  }
}

export async function retryReceiptOcr(receiptStoragePath: string): Promise<ReceiptScanResponse> {
  const supabase = createServiceClient();
  const bucket = legacyOriginalBucketForPath(receiptStoragePath);
  const { data, error } = await supabase.storage.from(bucket).download(receiptStoragePath);
  if (error || !data) {
    throw new ReceiptScanError("UPLOAD", "Could not load receipt for rescan.");
  }

  const raw = Buffer.from(await data.arrayBuffer());
  const isPdf = receiptStoragePath.toLowerCase().endsWith(".pdf");
  const mime = isPdf ? "application/pdf" : "image/jpeg";

  const pages = await normalizeUploadToScanImages(raw, mime);
  const ocr = await ocrScanPages(pages);
  const jobs = await loadJobsForMatching();
  const jobMatch = suggestJobMatch(jobs, {
    vendor: ocr.vendor,
    expenseDate: ocr.date,
    category: ocr.suggested_category,
    rawText: ocr.notes,
    lineItems: ocr.line_items,
  });

  const signed = await signReceiptAssets({
    receipt_original_path: receiptStoragePath,
    receipt_optimized_path: receiptStoragePath.replace("-original.", "-ocr.").replace(/\.(pdf|heic|heif|png|webp)$/i, ".jpg"),
  });

  return {
    success: true,
    confidence: ocr.confidence,
    vendor: ocr.vendor,
    date: ocr.date,
    total: ocr.total,
    subtotal: ocr.subtotal,
    tax: ocr.tax,
    payment_method: ocr.payment_method,
    card_last4: ocr.card_last4,
    receipt_number: ocr.receipt_number,
    suggested_category: ocr.suggested_category,
    suggested_job_id: jobMatch?.job_id ?? "",
    suggested_job_label: jobMatch?.label ?? "",
    notes: ocr.notes,
    line_items: ocr.line_items,
    warnings: ocr.warnings,
    receipt_url: signed.receipt_url,
    optimized_image_url: signed.optimized_image_url,
    thumbnail_url: signed.thumbnail_url,
    receipt_storage_path: receiptStoragePath,
    receipt_original_path: receiptStoragePath,
    optimized_storage_path: null,
    receipt_processing_status: "completed",
    scan_status: confidenceTier(ocr.confidence) === "low" ? "partial" : "scanned",
    ocr_version: ocr.ocr_version,
    description: ocr.vendor || "Receipt expense",
    page_count: pages.length,
  };
}
