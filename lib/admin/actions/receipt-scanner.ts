"use server";

import { revalidatePath } from "next/cache";
import { createExpense } from "@/lib/admin/actions/expenses";
import { extractReceiptFromImageUrl } from "@/lib/admin/receipt-extraction";
import type { ReceiptScanResponse } from "@/lib/receipt/scan-types";
import { createServiceClient } from "@/lib/supabase/service";

/** Legacy URL-based extraction — prefer POST /api/admin/expenses/scan */
export async function extractReceiptAction(receiptImageUrl: string) {
  if (!receiptImageUrl?.startsWith("http")) {
    throw new Error("Invalid receipt image URL");
  }
  return extractReceiptFromImageUrl(receiptImageUrl);
}

export async function retryReceiptScanAction(receiptStoragePath: string): Promise<ReceiptScanResponse> {
  if (!receiptStoragePath?.trim()) {
    throw new Error("Missing receipt path for rescan");
  }
  const { retryReceiptOcr } = await import("@/lib/receipt/retry-ocr");
  return retryReceiptOcr(receiptStoragePath);
}

export async function saveScannedExpenseAction(input: {
  expense_date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  receipt_storage_path?: string | null;
  receipt_original_path?: string | null;
  receipt_optimized_path?: string | null;
  receipt_thumbnail_path?: string | null;
  optimized_image_url?: string | null;
  receipt_processing_status?: string | null;
  job_id?: string | null;
  notes?: string | null;
  reimbursable?: boolean;
  tax_amount?: number | null;
  subtotal?: number | null;
  receipt_id?: string | null;
  scan_confidence?: number | null;
  scan_status?: string | null;
  scan_raw_response?: unknown;
  ocr_version?: string | null;
}) {
  let notes = input.notes?.trim() || null;
  if (input.tax_amount != null || input.subtotal != null) {
    const parts: string[] = [];
    if (input.subtotal != null) parts.push(`Subtotal: $${input.subtotal.toFixed(2)}`);
    if (input.tax_amount != null) parts.push(`Tax: $${input.tax_amount.toFixed(2)}`);
    const extra = parts.join(" · ");
    notes = notes ? `${notes} · ${extra}` : extra;
  }

  const expenseId = await createExpense({
    expense_date: input.expense_date,
    category: input.category,
    vendor: input.vendor,
    description: input.description,
    amount: input.amount,
    payment_method: input.payment_method,
    receipt_url: input.receipt_url,
    receipt_storage_path: input.receipt_storage_path ?? input.receipt_original_path ?? null,
    receipt_original_path: input.receipt_original_path ?? input.receipt_storage_path ?? null,
    receipt_optimized_path: input.receipt_optimized_path ?? null,
    receipt_thumbnail_path: input.receipt_thumbnail_path ?? null,
    optimized_image_url: input.optimized_image_url ?? null,
    receipt_processing_status: input.receipt_processing_status ?? "completed",
    receipt_processed_at: new Date().toISOString(),
    job_id: input.job_id ?? null,
    notes,
    reimbursable: input.reimbursable ?? false,
    expense_type: input.job_id ? "Job" : "Operating",
    scan_confidence: input.scan_confidence ?? null,
    scan_status: input.scan_status ?? "manual",
    scan_raw_response: input.scan_raw_response ?? null,
    ocr_version: input.ocr_version ?? null,
  });

  if (input.receipt_id) {
    try {
      const supabase = createServiceClient();
      await supabase
        .from("expense_receipts")
        .update({
          expense_id: expenseId,
          job_id: input.job_id ?? null,
          status: "linked",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.receipt_id);
    } catch {
      /* non-blocking */
    }
  }

  revalidatePath("/admin/expenses");
}

export type BulkExpenseSaveInput = {
  expense_date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  receipt_storage_path?: string | null;
  receipt_original_path?: string | null;
  receipt_optimized_path?: string | null;
  receipt_thumbnail_path?: string | null;
  optimized_image_url?: string | null;
  receipt_processing_status?: string | null;
  job_id?: string | null;
  notes?: string | null;
  reimbursable?: boolean;
  tax_amount?: number | null;
  subtotal?: number | null;
  receipt_id?: string | null;
  scan_confidence?: number | null;
  scan_status?: string | null;
  ocr_version?: string | null;
};

export type BulkExpenseSaveResult = {
  saved: number;
  failed: { index: number; vendor: string; error: string }[];
};

export async function saveBulkScannedExpensesAction(
  rows: BulkExpenseSaveInput[],
): Promise<BulkExpenseSaveResult> {
  const failed: BulkExpenseSaveResult["failed"] = [];
  let saved = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      await saveScannedExpenseAction(row);
      saved += 1;
    } catch (e) {
      failed.push({
        index: i,
        vendor: row.vendor || `Row ${i + 1}`,
        error: e instanceof Error ? e.message : "Could not save",
      });
    }
  }

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/expenses/scan");
  return { saved, failed };
}
