import type { ReceiptScanResponse } from "@/lib/receipt/scan-types";
import { BULK_SCAN_BATCH_SIZE } from "@/lib/receipt/bulk-scan-client";

export const BULK_SCAN_API_TIMEOUT_MS = 90_000;
export const BULK_QUEUE_STALL_MS = 45_000;
export const BULK_QUEUE_WATCHDOG_INTERVAL_MS = 5_000;

export type BulkQueueItemStatus =
  | "queued"
  | "uploading"
  | "converting"
  | "scanning"
  | "saving"
  | "completed"
  | "failed";

export type BulkQueueMetrics = {
  total: number;
  queued: number;
  active: number;
  completed: number;
  failed: number;
  percent: number;
  batchIndex: number;
  batchCount: number;
  lastHeartbeatAt: number;
};

export type BulkQueueLogLevel = "info" | "warn" | "error";

export function logBulkScan(level: BulkQueueLogLevel, message: string, details?: Record<string, unknown>) {
  const payload = { level, message, ...details, ts: new Date().toISOString() };
  if (level === "error") console.error("[BulkScan]", payload);
  else if (level === "warn") console.warn("[BulkScan]", payload);
  else console.info("[BulkScan]", payload);
}

export function computeQueueMetrics(
  statuses: BulkQueueItemStatus[],
  batchIndex = 0,
  batchCount = 0,
): BulkQueueMetrics {
  const active = new Set<BulkQueueItemStatus>(["uploading", "converting", "scanning", "saving"]);
  const total = statuses.length;
  const completed = statuses.filter((s) => s === "completed").length;
  const failed = statuses.filter((s) => s === "failed").length;
  const queued = statuses.filter((s) => s === "queued").length;
  const activeCount = statuses.filter((s) => active.has(s)).length;
  const done = completed + failed;
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return {
    total,
    queued,
    active: activeCount,
    completed,
    failed,
    percent,
    batchIndex,
    batchCount,
    lastHeartbeatAt: Date.now(),
  };
}

export async function scanReceiptViaApiWithTimeout(
  file: File,
  options: { pathPrefix?: string; jobId?: string; timeoutMs?: number },
): Promise<
  | { ok: true; data: ReceiptScanResponse }
  | { ok: false; error: string; data?: Partial<ReceiptScanResponse>; timedOut?: boolean }
> {
  const timeoutMs = options.timeoutMs ?? BULK_SCAN_API_TIMEOUT_MS;
  const form = new FormData();
  form.append("file", file);
  form.append("pathPrefix", options.pathPrefix ?? "expenses/bulk");
  if (options.jobId) form.append("jobId", options.jobId);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    logBulkScan("info", "scan start", { file: file.name, size: file.size, timeoutMs });
    const res = await fetch("/api/admin/expenses/scan", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const body = (await res.json()) as ReceiptScanResponse & { error?: string };

    if (!res.ok) {
      logBulkScan("warn", "scan HTTP error", { file: file.name, status: res.status, error: body.error });
      return {
        ok: false,
        error: body.error ?? body.warnings?.[0] ?? `Scan failed (${res.status})`,
        data: body,
      };
    }

    logBulkScan("info", "scan ok", { file: file.name, confidence: body.confidence });
    return { ok: true, data: body };
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "AbortError";
    const error = timedOut
      ? `Scan timed out after ${Math.round(timeoutMs / 1000)}s — retry this receipt.`
      : e instanceof Error
        ? e.message
        : "Network error during scan";
    logBulkScan(timedOut ? "warn" : "error", "scan exception", { file: file.name, error });
    return { ok: false, error, timedOut };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Process all queued items in batches. Never throws — failures are isolated per item.
 * Calls getQueuedItems() each batch so new enqueue during run can be picked up by a follow-up drain.
 */
export async function runBulkScanBatches<T extends { id: string }>(input: {
  getQueuedItems: () => T[];
  batchSize?: number;
  shouldStop?: () => boolean;
  onHeartbeat?: () => void;
  processOne: (item: T, ctx: { batchIndex: number; indexInBatch: number }) => Promise<void>;
}): Promise<{ processed: number; failed: number; batches: number }> {
  const batchSize = input.batchSize ?? BULK_SCAN_BATCH_SIZE;
  let processed = 0;
  let failed = 0;
  let batches = 0;

  while (true) {
    if (input.shouldStop?.()) {
      logBulkScan("info", "worker stop requested");
      break;
    }

    const queued = input.getQueuedItems();
    if (!queued.length) break;

    for (let i = 0; i < queued.length; i += batchSize) {
      if (input.shouldStop?.()) break;

      const batch = queued.slice(i, i + batchSize);
      batches += 1;
      const batchIndex = batches;

      logBulkScan("info", "batch start", {
        batchIndex,
        size: batch.length,
        remaining: queued.length - i,
      });

      input.onHeartbeat?.();

      const results = await Promise.allSettled(
        batch.map((item, indexInBatch) =>
          input.processOne(item, { batchIndex, indexInBatch }).catch((err) => {
            logBulkScan("error", "processOne rejected", {
              id: item.id,
              error: err instanceof Error ? err.message : String(err),
            });
          }),
        ),
      );

      for (const r of results) {
        if (r.status === "fulfilled") processed += 1;
        else failed += 1;
      }

      input.onHeartbeat?.();
      logBulkScan("info", "batch done", { batchIndex, processed, failed });
    }

    // Re-read queue: if nothing left, exit; else loop handles newly discovered items
    if (!input.getQueuedItems().length) break;
  }

  return { processed, failed, batches };
}
