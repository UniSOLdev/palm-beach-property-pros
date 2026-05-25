export const RECEIPT_PROCESSING_STATUSES = [
  "queued",
  "converting",
  "optimizing",
  "scanning",
  "completed",
  "failed",
] as const;

export type ReceiptProcessingStatus = (typeof RECEIPT_PROCESSING_STATUSES)[number];

export const PROCESSING_STATUS_LABELS: Record<ReceiptProcessingStatus, string> = {
  queued: "Queued",
  converting: "Converting",
  optimizing: "Optimizing",
  scanning: "Scanning",
  completed: "Complete",
  failed: "Failed",
};

export function isReceiptFullyProcessed(input: {
  receipt_processing_status?: string | null;
  receipt_optimized_path?: string | null;
  receipt_thumbnail_path?: string | null;
  optimized_storage_path?: string | null;
}): boolean {
  if (input.receipt_processing_status === "completed") return true;
  const hasOptimized = Boolean(
    input.receipt_optimized_path?.trim() || input.optimized_storage_path?.trim(),
  );
  const hasThumb = Boolean(input.receipt_thumbnail_path?.trim());
  return hasOptimized && hasThumb;
}
