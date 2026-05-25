import type { ReceiptScanResponse } from "@/lib/receipt/scan-types";

export const BULK_SCAN_BATCH_SIZE = 2;
export const BULK_SCAN_MAX_FILES = 25;
export const BULK_SCAN_MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "pdf", "heic", "heif"]);

export const BULK_ALLOWED_LABEL = "JPG, JPEG, PNG, WebP, HEIC, HEIF, PDF";

export function validateBulkReceiptFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size <= 0) return { ok: false, error: "File is empty." };
  if (file.size > BULK_SCAN_MAX_BYTES) return { ok: false, error: "File must be under 12 MB." };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, error: `Unsupported type (.${ext || "?"}). Use ${BULK_ALLOWED_LABEL}.` };
  }
  return { ok: true };
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isImagePreviewable(file: File): boolean {
  return !isPdfFile(file);
}

export async function scanReceiptViaApi(
  file: File,
  options: { pathPrefix?: string; jobId?: string },
): Promise<{ ok: true; data: ReceiptScanResponse } | { ok: false; error: string; data?: Partial<ReceiptScanResponse> }> {
  const form = new FormData();
  form.append("file", file);
  form.append("pathPrefix", options.pathPrefix ?? "expenses/bulk");
  if (options.jobId) form.append("jobId", options.jobId);

  try {
    const res = await fetch("/api/admin/expenses/scan", { method: "POST", body: form });
    const body = (await res.json()) as ReceiptScanResponse & { error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error ?? body.warnings?.[0] ?? `Scan failed (${res.status})`,
        data: body,
      };
    }

    return { ok: true, data: body };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error during scan",
    };
  }
}

export async function processReceiptsInBatches<T extends { id: string }>(
  items: T[],
  batchSize: number,
  handler: (item: T, index: number) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map((item, j) => handler(item, i + j)));
  }
}
