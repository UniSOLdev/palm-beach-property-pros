/** Standardized receipt storage buckets (see migration 20260529120000). */
export const RECEIPT_BUCKETS = {
  original: "receipts-original",
  optimized: "receipts-optimized",
  thumbnail: "receipts-thumbnails",
  debug: "receipts-debug",
} as const;

/** Legacy buckets — read during retroactive migration only. */
export const LEGACY_RECEIPT_BUCKETS = {
  original: "receipts",
  optimized: "receipts-optimized",
} as const;

export type ReceiptBucketId =
  | (typeof RECEIPT_BUCKETS)[keyof typeof RECEIPT_BUCKETS]
  | (typeof LEGACY_RECEIPT_BUCKETS)[keyof typeof LEGACY_RECEIPT_BUCKETS];

export function resolveOriginalBucket(path: string): string {
  if (path.startsWith("expenses/") || path.includes("-original.")) {
    return RECEIPT_BUCKETS.original;
  }
  return LEGACY_RECEIPT_BUCKETS.original;
}

export function resolveOptimizedBucket(path: string): string {
  if (path.includes("-ocr") && !path.startsWith("jobs/")) {
    return path.startsWith("expenses/")
      ? RECEIPT_BUCKETS.optimized
      : LEGACY_RECEIPT_BUCKETS.optimized;
  }
  return path.startsWith("expenses/") ? RECEIPT_BUCKETS.optimized : LEGACY_RECEIPT_BUCKETS.optimized;
}

export function legacyOriginalBucketForPath(path: string): string {
  if (path.startsWith("expenses/pending/") || path.startsWith("expenses/")) {
    return RECEIPT_BUCKETS.original;
  }
  return LEGACY_RECEIPT_BUCKETS.original;
}

export function isLegacyReceiptPath(path: string): boolean {
  return (
    !path.startsWith("expenses/pending/") &&
    (path.startsWith("expenses/") && path.includes("-original.")) === false &&
    (path.includes("-original.") || path.includes("-ocr"))
  );
}
