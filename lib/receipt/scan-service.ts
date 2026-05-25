import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { suggestJobMatch, type JobMatchCandidate } from "@/lib/receipt/job-matching";
import {
  normalizeReceiptMime,
  processReceiptImage,
  toDataUrl,
  validateReceiptUpload,
} from "@/lib/receipt/image-pipeline";
import { runReceiptOcr } from "@/lib/receipt/ocr";
import { uploadReceiptBuffers } from "@/lib/receipt/storage";
import type { ReceiptScanResponse } from "@/lib/receipt/scan-types";
import { OCR_VERSION, confidenceTier } from "@/lib/receipt/scan-types";
import { ReceiptScanError } from "@/lib/receipt/errors";

export async function scanReceiptFromFile(
  file: File,
  options: { pathPrefix?: string; userId?: string | null } = {},
): Promise<ReceiptScanResponse> {
  const started = Date.now();
  const pathPrefix = options.pathPrefix ?? "expenses";
  validateReceiptUpload({ name: file.name, size: file.size, type: file.type });
  const mime = normalizeReceiptMime(file.type, file.name);

  if (mime === "application/pdf") {
    return scanPdfFallback(file, pathPrefix, options.userId, started);
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const processed = await processReceiptImage(inputBuffer, mime);
  const dataUrl = toDataUrl(processed.buffer, processed.mime);

  const ocr = await runReceiptOcr(dataUrl);
  const ext = processed.wasHeic ? "heic" : file.name.split(".").pop()?.toLowerCase() ?? "jpg";

  const uploaded = await uploadReceiptBuffers({
    pathPrefix,
    original: { buffer: inputBuffer, mime, ext },
    optimized: { buffer: processed.buffer, mime: processed.mime },
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
  if (processed.wasHeic) warnings.push("iPhone HEIC photo converted for scanning.");

  const description =
    ocr.vendor ||
    (ocr.line_items[0]?.description ?? "") ||
    "Receipt expense";

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
  };

  await persistScanArtifacts({
    response,
    userId: options.userId,
    originalMime: mime,
    originalSize: file.size,
    optimizedSize: processed.buffer.length,
    ocrModel: ocr.model,
    rawResponse: ocr.raw,
    durationMs: Date.now() - started,
  });

  logPipelineInfo("receipt scan completed", {
    step: "scanReceiptFromFile",
    details: {
      confidence: ocr.confidence,
      scan_status,
      durationMs: Date.now() - started,
    },
  });

  return response;
}

async function scanPdfFallback(
  file: File,
  pathPrefix: string,
  userId: string | null | undefined,
  started: number,
): Promise<ReceiptScanResponse> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadReceiptBuffers({
    pathPrefix,
    original: { buffer, mime: "application/pdf", ext: "pdf" },
  });

  const today = new Date().toISOString().slice(0, 10);
  const response: ReceiptScanResponse = {
    success: true,
    confidence: 0.2,
    vendor: "",
    date: today,
    total: 0,
    subtotal: 0,
    tax: 0,
    payment_method: "Card",
    card_last4: null,
    receipt_number: "",
    suggested_category: "Misc",
    suggested_job_id: "",
    suggested_job_label: "",
    notes: "",
    line_items: [],
    warnings: ["PDF uploaded — OCR works best on photos. Enter details manually or retry with a photo."],
    receipt_url: uploaded.receipt_url,
    optimized_image_url: null,
    receipt_storage_path: uploaded.receipt_storage_path,
    optimized_storage_path: null,
    scan_status: "partial",
    ocr_version: OCR_VERSION,
    description: "PDF receipt",
  };

  await persistScanArtifacts({
    response,
    userId,
    originalMime: "application/pdf",
    originalSize: file.size,
    optimizedSize: null,
    ocrModel: null,
    rawResponse: null,
    durationMs: Date.now() - started,
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

export async function retryReceiptOcr(receiptStoragePath: string): Promise<ReceiptScanResponse> {
  const supabase = createServiceClient();
  const optPath = receiptStoragePath.replace(/-original\.[^/]+$/, "-ocr.jpg");
  let buffer: Buffer | null = null;

  const { data: optData, error: optErr } = await supabase.storage.from("receipts-optimized").download(optPath);
  if (!optErr && optData) {
    buffer = Buffer.from(await optData.arrayBuffer());
  } else {
    const { data, error } = await supabase.storage.from("receipts").download(receiptStoragePath);
    if (error || !data) {
      throw new ReceiptScanError("UPLOAD", "Could not load receipt for rescan.");
    }
    const raw = Buffer.from(await data.arrayBuffer());
    const processed = await processReceiptImage(raw, "image/jpeg");
    buffer = processed.buffer;
  }

  const ocr = await runReceiptOcr(toDataUrl(buffer, "image/jpeg"));
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
  };
}
