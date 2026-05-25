export type ReceiptLineItem = {
  description: string;
  amount: number;
  quantity?: number;
};

export type ReceiptScanResponse = {
  success: boolean;
  confidence: number;
  vendor: string;
  date: string;
  total: number;
  subtotal: number;
  tax: number;
  payment_method: string;
  card_last4: string | null;
  receipt_number: string;
  suggested_category: string;
  suggested_job_id: string;
  suggested_job_label: string;
  notes: string;
  line_items: ReceiptLineItem[];
  warnings: string[];
  /** Internal / UI */
  receipt_id?: string;
  receipt_url: string | null;
  optimized_image_url: string | null;
  receipt_storage_path: string;
  optimized_storage_path: string | null;
  scan_status: "scanned" | "partial" | "failed" | "manual";
  ocr_version: string;
  description: string;
};

export const OCR_VERSION = "openai-vision-v2";
export const OCR_MODEL = process.env.OPENAI_RECEIPT_MODEL?.trim() || "gpt-4.1-mini";

export function confidenceTier(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.45) return "medium";
  return "low";
}
