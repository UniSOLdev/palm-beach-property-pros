import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { suggestJobMatch, type JobMatchCandidate } from "@/lib/receipt/job-matching";
import {
  normalizeReceiptMime,
  toDataUrl,
  validateReceiptUpload,
} from "@/lib/receipt/image-pipeline";
import { normalizeUploadToScanImages } from "@/lib/receipt/normalize-upload";
import { mergeOcrResults } from "@/lib/receipt/ocr-merge";
import { runReceiptOcr, type OcrParseResult } from "@/lib/receipt/ocr";
import { uploadReceiptBuffers } from "@/lib/receipt/storage";
import type { ReceiptScanResponse } from "@/lib/receipt/scan-types";
import { confidenceTier } from "@/lib/receipt/scan-types";

function fileExtension(mime: string, fileName: string): string {
  if (mime === "application/pdf") return "pdf";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext && ["heic", "heif", "jpg", "jpeg", "png", "webp", "pdf"].includes(ext)) return ext;
  if (mime === "image/heic" || mime === "image/heif") return "heic";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
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

export async function scanReceiptFromFile(
  file: File,
  options: { pathPrefix?: string; userId?: string | null } = {},
): Promise<ReceiptScanResponse> {
  const started = Date.now();
  const pathPrefix = options.pathPrefix ?? "expenses";
  validateReceiptUpload({ name: file.name, size: file.size, type: file.type });
  const mime = normalizeReceiptMime(file.type, file.name);
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  const pages = await normalizeUploadToScanImages(inputBuffer, mime);
  const ocr = await ocrAllPages(pages);
  const ext = fileExtension(mime, file.name);

  const uploaded = await uploadReceiptBuffers({
    pathPrefix,
    original: { buffer: inputBuffer, mime, ext },
    optimizedPages: pages.map((p) => ({
      buffer: p.buffer,
      mime: p.mime,
      page: p.pageIndex,
    })),
  });

  const jobs = await loadJobsForMatching();
  const jobMatch = suggestJobMatch(jobs, {
    vendor: ocr.vendor,
    expenseDate: ocr.date,
    category: ocr.suggested_category,
    rawText: ocr.notes,
    lineItems: ocr.line_items,
  });

  const tier = confidenceTier(ocr.confidence);
  const scan_status =
    tier === "low" || ocr.total <= 0 ? "partial" : tier === "medium" ? "partial" : "scanned";

  const warnings = [...ocr.warnings];
  if (pages.some((p) => p.wasHeic)) warnings.push("HEIC/HEIF converted to JPEG for scanning.");
  if (mime === "application/pdf") {
    warnings.unshift(
      pages.length > 1
        ? `PDF scanned across ${pages.length} pages.`
        : "PDF converted to image for scanning.",
    );
  }

  const description =
    ocr.vendor || (ocr.line_items[0]?.description ?? "") || "Receipt expense";

  const response: ReceiptScanResponse = {
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
    warnings,
    receipt_url: uploaded.receipt_url,
    optimized_image_url: uploaded.optimized_image_url,
    receipt_storage_path: uploaded.receipt_storage_path,
    optimized_storage_path: uploaded.optimized_storage_path,
    scan_status,
    ocr_version: ocr.ocr_version,
    description,
    page_count: pages.length,
  };

  await persistScanArtifacts({
    response,
    userId: options.userId,
    originalMime: mime,
    originalSize: file.size,
    optimizedSize: pages.reduce((s, p) => s + p.buffer.length, 0),
    ocrModel: ocr.model,
    rawResponse: ocr.raw,
    durationMs: Date.now() - started,
  });

  logPipelineInfo("receipt scan completed", {
    step: "scanReceiptFromFile",
    details: {
      confidence: ocr.confidence,
      scan_status,
      pages: pages.length,
      mime,
      durationMs: Date.now() - started,
    },
  });

  return response;
}

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

async function persistScanArtifacts(input: {
  response: ReceiptScanResponse;
  userId?: string | null;
  originalMime: string;
  originalSize: number;
  optimizedSize: number | null;
  ocrModel: string | null;
  rawResponse: unknown;
  durationMs: number;
}) {
  try {
    const supabase = createServiceClient();
    const { data: receipt, error: receiptErr } = await supabase
      .from("expense_receipts")
      .insert({
        created_by: input.userId ?? null,
        status: "draft",
        vendor: input.response.vendor || null,
        expense_date: input.response.date || null,
        amount: input.response.total || null,
        subtotal: input.response.subtotal || null,
        tax: input.response.tax || null,
        category: input.response.suggested_category,
        payment_method: input.response.payment_method,
        card_last4: input.response.card_last4,
        receipt_number: input.response.receipt_number || null,
        suggested_job_id: input.response.suggested_job_id || null,
        receipt_storage_path: input.response.receipt_storage_path,
        optimized_storage_path: input.response.optimized_storage_path,
        receipt_url: input.response.receipt_url,
        optimized_image_url: input.response.optimized_image_url,
        scan_status: input.response.scan_status,
        scan_confidence: input.response.confidence,
        scan_raw_response: input.rawResponse,
        ocr_version: input.response.ocr_version,
        line_items: input.response.line_items,
        warnings: input.response.warnings,
        notes: input.response.notes || null,
      })
      .select("id")
      .single();

    if (receiptErr) {
      logPipelineError("expense_receipts insert failed", receiptErr, { step: "persistScanArtifacts" });
      return;
    }

    input.response.receipt_id = receipt.id;

    await supabase.from("expense_scan_logs").insert({
      receipt_id: receipt.id,
      user_id: input.userId ?? null,
      original_mime: input.originalMime,
      original_size_bytes: input.originalSize,
      optimized_size_bytes: input.optimizedSize,
      scan_status: input.response.scan_status,
      scan_confidence: input.response.confidence,
      ocr_version: input.response.ocr_version,
      model: input.ocrModel,
      duration_ms: input.durationMs,
      raw_response: input.rawResponse,
      warnings: input.response.warnings,
    });
  } catch (err) {
    logPipelineError("persistScanArtifacts exception", err, { step: "persistScanArtifacts" });
  }
}
