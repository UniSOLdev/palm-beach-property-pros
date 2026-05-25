import { createServiceClient } from "@/lib/supabase/service";
import { ReceiptScanError } from "@/lib/receipt/errors";
import { toDataUrl } from "@/lib/receipt/image-pipeline";
import { normalizeUploadToScanImages } from "@/lib/receipt/normalize-upload";
import { mergeOcrResults } from "@/lib/receipt/ocr-merge";
import { runReceiptOcr, type OcrParseResult } from "@/lib/receipt/ocr";
import { suggestJobMatch, type JobMatchCandidate } from "@/lib/receipt/job-matching";
import { createClient } from "@/lib/supabase/server";
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

async function ocrAllPages(
  pages: Awaited<ReturnType<typeof normalizeUploadToScanImages>>,
): Promise<OcrParseResult> {
  const results: OcrParseResult[] = [];
  for (const page of pages) {
    results.push(await runReceiptOcr(toDataUrl(page.buffer, page.mime)));
  }
  return mergeOcrResults(results);
}

export async function retryReceiptOcr(receiptStoragePath: string): Promise<ReceiptScanResponse> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from("receipts").download(receiptStoragePath);
  if (error || !data) {
    throw new ReceiptScanError("UPLOAD", "Could not load receipt for rescan.");
  }

  const raw = Buffer.from(await data.arrayBuffer());
  const isPdf = receiptStoragePath.toLowerCase().endsWith(".pdf");
  const mime = isPdf ? "application/pdf" : "image/jpeg";

  const pages = await normalizeUploadToScanImages(raw, mime);
  const ocr = await ocrAllPages(pages);
  const jobs = await loadJobsForMatching();
  const jobMatch = suggestJobMatch(jobs, {
    vendor: ocr.vendor,
    expenseDate: ocr.date,
    category: ocr.suggested_category,
    rawText: ocr.notes,
    lineItems: ocr.line_items,
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
    receipt_url: null,
    optimized_image_url: null,
    receipt_storage_path: receiptStoragePath,
    optimized_storage_path: null,
    scan_status: confidenceTier(ocr.confidence) === "low" ? "partial" : "scanned",
    ocr_version: ocr.ocr_version,
    description: ocr.vendor || "Receipt expense",
    page_count: pages.length,
  };
}
