"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  retryReceiptScanAction,
  saveBulkScannedExpensesAction,
  saveScannedExpenseAction,
  type BulkExpenseSaveInput,
} from "@/lib/admin/actions/receipt-scanner";
import { RECEIPT_EXPENSE_CATEGORIES } from "@/lib/admin/receipt-categories";
import { PAYMENT_METHODS } from "@/lib/admin/constants";
import {
  BULK_ALLOWED_LABEL,
  BULK_SCAN_BATCH_SIZE,
  BULK_SCAN_MAX_FILES,
  isImagePreviewable,
  isPdfFile,
  scanReceiptViaApi,
  validateBulkReceiptFile,
} from "@/lib/receipt/bulk-scan-client";
import {
  BULK_QUEUE_STALL_MS,
  BULK_QUEUE_WATCHDOG_INTERVAL_MS,
  computeQueueMetrics,
  logBulkScan,
  runBulkScanBatches,
  type BulkQueueItemStatus,
  type BulkQueueMetrics,
} from "@/lib/receipt/bulk-scan-queue";
import type { ReceiptScanResponse } from "@/lib/receipt/scan-types";
import { confidenceTier } from "@/lib/receipt/scan-types";

type JobOption = { id: string; label: string };

/** Scan/save lifecycle — `saved` = persisted expense */
export type BulkReceiptStatus = BulkQueueItemStatus | "saved" | "removed";

const IN_FLIGHT_STATUSES: BulkReceiptStatus[] = ["uploading", "converting", "scanning"];

export type BulkReceiptRow = {
  id: string;
  fileName: string;
  file: File | null;
  previewUrl: string | null;
  status: BulkReceiptStatus;
  error: string | null;
  approved: boolean;
  saving: boolean;
  scan: ReceiptScanResponse | null;
  vendor: string;
  expenseDate: string;
  total: number;
  tax: number | "";
  subtotal: number | "";
  category: string;
  paymentMethod: string;
  notes: string;
  description: string;
  jobId: string;
};

function newRowId() {
  return crypto.randomUUID();
}

function rowFromScan(file: File, scan: ReceiptScanResponse, defaultJobId?: string): BulkReceiptRow {
  const tier = confidenceTier(scan.confidence);
  const warn = scan.warnings?.[0] ?? null;
  return {
    id: newRowId(),
    fileName: file.name,
    file,
    previewUrl:
      scan.thumbnail_url ??
      scan.optimized_image_url ??
      (isImagePreviewable(file) ? URL.createObjectURL(file) : null),
    status: "completed",
    error: warn,
    approved: scan.total > 0 && tier !== "low",
    saving: false,
    scan,
    vendor: scan.vendor,
    expenseDate: scan.date,
    total: scan.total,
    tax: scan.tax > 0 ? scan.tax : "",
    subtotal: scan.subtotal > 0 ? scan.subtotal : "",
    category: scan.suggested_category,
    paymentMethod: scan.payment_method,
    notes: scan.notes ?? "",
    description: scan.description || scan.vendor,
    jobId: defaultJobId ?? scan.suggested_job_id ?? "",
  };
}

function rowFromValidationError(file: File, error: string): BulkReceiptRow {
  return {
    id: newRowId(),
    fileName: file.name,
    file,
    previewUrl: isImagePreviewable(file) ? URL.createObjectURL(file) : null,
    status: "failed",
    error,
    approved: false,
    saving: false,
    scan: null,
    vendor: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    total: 0,
    tax: "",
    subtotal: "",
    category: "Misc",
    paymentMethod: "Card",
    notes: "",
    description: "",
    jobId: "",
  };
}

function toSaveInput(row: BulkReceiptRow): BulkExpenseSaveInput {
  return {
    expense_date: row.expenseDate,
    category: row.category,
    vendor: row.vendor.trim(),
    description: row.description.trim() || row.vendor.trim(),
    amount: row.total,
    payment_method: row.paymentMethod,
    receipt_url: row.scan?.receipt_url ?? null,
    receipt_storage_path: row.scan?.receipt_storage_path ?? null,
    receipt_original_path: row.scan?.receipt_original_path ?? row.scan?.receipt_storage_path ?? null,
    receipt_optimized_path: row.scan?.receipt_optimized_path ?? row.scan?.optimized_storage_path ?? null,
    receipt_thumbnail_path: row.scan?.receipt_thumbnail_path ?? null,
    optimized_image_url: row.scan?.optimized_image_url ?? null,
    receipt_processing_status: row.scan?.receipt_processing_status ?? "completed",
    job_id: row.jobId || null,
    notes: row.notes || null,
    reimbursable: false,
    tax_amount: row.tax === "" ? null : Number(row.tax),
    subtotal: row.subtotal === "" ? null : Number(row.subtotal),
    receipt_id: row.scan?.receipt_id ?? null,
    scan_confidence: row.scan?.confidence ?? null,
    scan_status: row.scan?.scan_status ?? "manual",
    ocr_version: row.scan?.ocr_version ?? null,
  };
}

function StatusPill({ status }: { status: BulkReceiptStatus }) {
  const map: Record<BulkReceiptStatus, string> = {
    queued: "bg-sky/40 text-navy",
    uploading: "bg-ocean/10 text-navy animate-pulse",
    converting: "bg-ocean/15 text-navy animate-pulse",
    scanning: "bg-ocean/25 text-navy animate-pulse",
    saving: "bg-amber-100 text-amber-900 animate-pulse",
    completed: "bg-green-100 text-green-900",
    failed: "bg-red-100 text-red-800",
    saved: "bg-green-200 text-green-950",
    removed: "bg-charcoal/10 text-charcoal/50",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${map[status] ?? "bg-charcoal/10"}`}>
      {status}
    </span>
  );
}

function QueueProgressPanel({
  metrics,
  processing,
  currentBatch,
}: {
  metrics: BulkQueueMetrics;
  processing: boolean;
  currentBatch: number;
}) {
  if (!processing && metrics.total === 0) return null;
  const heartbeatAgeSec = Math.max(0, Math.round((Date.now() - metrics.lastHeartbeatAt) / 1000));

  return (
    <div className="rounded-xl border border-ocean/20 bg-sky/15 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-bold text-navy">
          {processing ? "Processing queue…" : "Queue idle"}
        </span>
        <span className="text-charcoal/60">
          Batch {currentBatch || metrics.batchIndex || 0}
          {metrics.batchCount > 0 ? ` / ${metrics.batchCount}` : ""} · heartbeat {heartbeatAgeSec}s ago
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-charcoal/10">
        <div
          className="h-full rounded-full bg-ocean transition-all duration-300"
          style={{ width: `${metrics.percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-xs font-semibold text-charcoal/70">
        <span>{metrics.percent}%</span>
        <span>Queued {metrics.queued}</span>
        <span>Active {metrics.active}</span>
        <span className="text-green-800">Done {metrics.completed}</span>
        <span className="text-red-700">Failed {metrics.failed}</span>
        <span>Total {metrics.total}</span>
      </div>
    </div>
  );
}

export function BulkReceiptScanner({
  jobs = [],
  defaultJobId,
  storagePrefix = "expenses/bulk",
}: {
  jobs?: JobOption[];
  defaultJobId?: string;
  storagePrefix?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState<BulkReceiptRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<BulkQueueMetrics>(() =>
    computeQueueMetrics([]),
  );
  const [currentBatch, setCurrentBatch] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const rowsRef = useRef(rows);
  const workerRunningRef = useRef(false);
  const drainPendingRef = useRef(false);
  const heartbeatRef = useRef(Date.now());
  const batchIndexRef = useRef(0);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const activeRows = rows.filter((r) => r.status !== "removed");
  const reviewCount = activeRows.filter((r) => r.status === "completed" || r.status === "failed").length;
  const approvedRows = activeRows.filter(
    (r) => r.approved && r.status !== "saved" && r.vendor.trim() && r.total > 0,
  );

  const syncMetrics = useCallback((batchIndex?: number, batchCount?: number) => {
    const statuses = rowsRef.current
      .filter((r) => r.status !== "removed")
      .map((r) => r.status as BulkQueueItemStatus);
    heartbeatRef.current = Date.now();
    setQueueMetrics(
      computeQueueMetrics(statuses, batchIndex ?? batchIndexRef.current, batchCount ?? 0),
    );
  }, []);

  const patchRow = useCallback((id: string, patch: Partial<BulkReceiptRow>) => {
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      rowsRef.current = next;
      return next;
    });
  }, []);

  const updateRow = patchRow;

  const processOneReceipt = useCallback(
    async (item: BulkReceiptRow, ctx: { batchIndex: number }) => {
      const file = item.file;
      if (!file) {
        patchRow(item.id, { status: "failed", error: "Missing file — re-upload to retry." });
        return;
      }

      batchIndexRef.current = ctx.batchIndex;
      setCurrentBatch(ctx.batchIndex);

      try {
        patchRow(item.id, { status: "uploading", error: null });
        await new Promise((r) => setTimeout(r, 50));
        patchRow(item.id, { status: "converting" });
        patchRow(item.id, { status: "scanning" });

        const result = await scanReceiptViaApi(file, {
          pathPrefix: storagePrefix,
          jobId: defaultJobId,
        });

        if (result.ok) {
          const mapped = rowFromScan(file, result.data, defaultJobId);
          patchRow(item.id, {
            ...mapped,
            id: item.id,
            file,
            previewUrl: mapped.previewUrl ?? item.previewUrl,
          });
          return;
        }

        if (result.data && typeof result.data === "object") {
          const partial = rowFromScan(file, result.data as ReceiptScanResponse, defaultJobId);
          patchRow(item.id, {
            ...partial,
            id: item.id,
            file,
            previewUrl: partial.previewUrl ?? item.previewUrl,
            status: "completed",
            error: result.error,
            approved: false,
          });
          return;
        }

        patchRow(item.id, {
          status: "failed",
          error: result.error,
          approved: false,
        });
      } catch (err) {
        logBulkScan("error", "row processing exception", {
          id: item.id,
          file: item.fileName,
          error: err instanceof Error ? err.message : String(err),
        });
        patchRow(item.id, {
          status: "failed",
          error: err instanceof Error ? err.message : "Scan failed unexpectedly",
          approved: false,
        });
      }
    },
    [defaultJobId, storagePrefix, patchRow],
  );

  const drainQueue = useCallback(async () => {
    if (workerRunningRef.current) {
      drainPendingRef.current = true;
      logBulkScan("info", "drain scheduled — worker already active");
      return;
    }

    workerRunningRef.current = true;
    drainPendingRef.current = false;
    setProcessing(true);
    setGlobalError("");
    heartbeatRef.current = Date.now();
    logBulkScan("info", "drain start");

    try {
      const summary = await runBulkScanBatches({
        batchSize: BULK_SCAN_BATCH_SIZE,
        getQueuedItems: () =>
          rowsRef.current.filter((r) => r.status === "queued" && r.file),
        onHeartbeat: () => {
          heartbeatRef.current = Date.now();
          syncMetrics(batchIndexRef.current);
        },
        processOne: async (item, ctx) => {
          await processOneReceipt(item, { batchIndex: ctx.batchIndex });
          syncMetrics(ctx.batchIndex);
        },
      });

      logBulkScan("info", "drain complete", summary);
    } catch (err) {
      logBulkScan("error", "drain fatal (lock released)", {
        error: err instanceof Error ? err.message : String(err),
      });
      setGlobalError("Queue processor error — retrying remaining files…");
    } finally {
      workerRunningRef.current = false;
      setProcessing(false);
      setCurrentBatch(0);
      syncMetrics(0, 0);

      const stuck = rowsRef.current.filter((r) => IN_FLIGHT_STATUSES.includes(r.status));
      if (stuck.length) {
        logBulkScan("warn", "releasing stuck in-flight rows", { count: stuck.length });
        setRows((prev) => {
          const next = prev.map((r) =>
            IN_FLIGHT_STATUSES.includes(r.status)
              ? { ...r, status: "queued" as const, error: "Reset after queue stall — processing again…" }
              : r,
          );
          rowsRef.current = next;
          return next;
        });
      }

      const stillQueued = rowsRef.current.some((r) => r.status === "queued" && r.file);
      if (stillQueued) {
        logBulkScan("info", "queued items remain — chaining drain");
        void drainQueue();
      } else if (drainPendingRef.current) {
        drainPendingRef.current = false;
        logBulkScan("info", "running pending chained drain");
        void drainQueue();
      }
    }
  }, [processOneReceipt, syncMetrics]);

  useEffect(() => {
    if (!processing) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - heartbeatRef.current;
      if (elapsed > BULK_QUEUE_STALL_MS && workerRunningRef.current) {
        logBulkScan("warn", "watchdog: stall recovery", { elapsedMs: elapsed });
        workerRunningRef.current = false;
        setProcessing(false);
        setRows((prev) => {
          const next = prev.map((r) =>
            IN_FLIGHT_STATUSES.includes(r.status)
              ? {
                  ...r,
                  status: "queued" as const,
                  error: "Queue stalled — auto-recovering…",
                }
              : r,
          );
          rowsRef.current = next;
          return next;
        });
        heartbeatRef.current = Date.now();
        void drainQueue();
      }
    }, BULK_QUEUE_WATCHDOG_INTERVAL_MS);
    return () => clearInterval(id);
  }, [processing, drainQueue]);

  function enqueueFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length > BULK_SCAN_MAX_FILES) {
      setGlobalError(`Only the first ${BULK_SCAN_MAX_FILES} files were added.`);
      files.splice(BULK_SCAN_MAX_FILES);
    }

    const newRows: BulkReceiptRow[] = [];
    for (const file of files) {
      const v = validateBulkReceiptFile(file);
      if (!v.ok) {
        newRows.push(rowFromValidationError(file, v.error));
      } else {
        newRows.push({
          id: newRowId(),
          fileName: file.name,
          file,
          previewUrl: isImagePreviewable(file) ? URL.createObjectURL(file) : null,
          status: "queued",
          error: null,
          approved: true,
          saving: false,
          scan: null,
          vendor: "",
          expenseDate: new Date().toISOString().slice(0, 10),
          total: 0,
          tax: "",
          subtotal: "",
          category: "Misc",
          paymentMethod: "Card",
          notes: "",
          description: "",
          jobId: defaultJobId ?? "",
        });
      }
    }

    setRows((prev) => {
      const next = [...prev, ...newRows];
      rowsRef.current = next;
      return next;
    });
    syncMetrics();
    if (newRows.some((r) => r.status === "queued")) void drainQueue();
  }

  function retryRow(row: BulkReceiptRow) {
    if (!row.file && !row.scan?.receipt_storage_path) {
      updateRow(row.id, { error: "Original file unavailable — re-upload to retry." });
      return;
    }

    startTransition(async () => {
      const scanMeta = row.scan;
      if (!row.file && scanMeta?.receipt_storage_path) {
        updateRow(row.id, { status: "scanning", error: null });
        try {
          const result = await retryReceiptScanAction(scanMeta.receipt_storage_path);
          updateRow(row.id, {
            ...rowFromScan(new File([], row.fileName), {
              ...result,
              receipt_url: scanMeta.receipt_url,
              optimized_image_url: scanMeta.optimized_image_url,
              receipt_storage_path: scanMeta.receipt_storage_path,
              optimized_storage_path: scanMeta.optimized_storage_path,
              receipt_id: scanMeta.receipt_id,
            }, defaultJobId),
            id: row.id,
            file: null,
            previewUrl: row.previewUrl,
          });
        } catch (e) {
          updateRow(row.id, {
            status: "failed",
            error: e instanceof Error ? e.message : "Rescan failed",
          });
        }
        return;
      }

      updateRow(row.id, { status: "queued", error: null });
      void drainQueue();
    });
  }

  function saveOne(row: BulkReceiptRow) {
    if (!row.vendor.trim() || row.total <= 0) {
      updateRow(row.id, { error: "Vendor and total are required." });
      return;
    }
    updateRow(row.id, { saving: true, status: "saving", error: null });
    startTransition(async () => {
      try {
        await saveScannedExpenseAction(toSaveInput(row));
        updateRow(row.id, { status: "saved", saving: false, approved: false });
        syncMetrics();
        router.refresh();
      } catch (e) {
        updateRow(row.id, {
          saving: false,
          error: e instanceof Error ? e.message : "Save failed",
        });
      }
    });
  }

  function saveAllApproved() {
    const targets = approvedRows;
    if (!targets.length) {
      setGlobalError("No approved rows with vendor and total to save.");
      return;
    }
    setBulkResult(null);
    setGlobalError("");
    targets.forEach((r) => updateRow(r.id, { saving: true, status: "saving" }));
    startTransition(async () => {
      const result = await saveBulkScannedExpensesAction(targets.map(toSaveInput));
      targets.forEach((r) => updateRow(r.id, { saving: false, status: "saved", approved: false }));
      if (result.failed.length) {
        result.failed.forEach((f) => {
          const row = targets[f.index];
          if (row) updateRow(row.id, { status: "completed", error: f.error, saving: false });
        });
        setBulkResult(`Saved ${result.saved} of ${targets.length}. ${result.failed.length} failed.`);
      } else {
        setBulkResult(`Saved ${result.saved} expense${result.saved === 1 ? "" : "s"}.`);
      }
      router.refresh();
    });
  }

  function removeRow(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "removed" as const } : r)));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length) enqueueFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      {globalError ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{globalError}</p>
      ) : null}
      {bulkResult ? (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-900">{bulkResult}</p>
      ) : null}

      <div className="admin-card space-y-3">
        <h2 className="text-lg font-bold text-navy">Bulk receipt upload</h2>
        <p className="text-sm text-charcoal/70">
          Select multiple receipts ({BULK_ALLOWED_LABEL}). Each file is normalized server-side (HEIC→JPEG,
          PDF→pages) then scanned in batches of {BULK_SCAN_BATCH_SIZE}.
        </p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="rounded-xl border-2 border-dashed border-ocean/40 bg-sky/20 p-6 text-center"
        >
          <label className="flex cursor-pointer flex-col items-center gap-2 font-semibold text-navy">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) enqueueFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <span className="text-2xl">📁</span>
            <span>Choose files or drop receipts here</span>
            <span className="text-xs font-normal text-charcoal/55">
              {BULK_ALLOWED_LABEL} · up to {BULK_SCAN_MAX_FILES} files · 12 MB each
            </span>
          </label>
        </div>
        <QueueProgressPanel metrics={queueMetrics} processing={processing} currentBatch={currentBatch} />
      </div>

      {activeRows.length > 0 ? (
        <>
          <div className="admin-card space-y-2">
            <h3 className="text-sm font-bold text-navy">Upload queue</h3>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {activeRows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-lg border border-navy/10 bg-cream/40 p-2"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                    {row.previewUrl && !isPdfFile(row.file ?? new File([], row.fileName)) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg">
                        {row.fileName.toLowerCase().endsWith(".pdf") ? "PDF" : "📄"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{row.fileName}</p>
                    {row.status === "completed" || row.status === "failed" ? (
                      <p className="truncate text-xs text-charcoal/60">
                        {row.vendor || "—"} · {row.expenseDate} ·{" "}
                        {row.total > 0 ? `$${row.total.toFixed(2)}` : "—"} · {row.category}
                        {row.scan?.page_count && row.scan.page_count > 1
                          ? ` · ${row.scan.page_count} pages`
                          : ""}
                      </p>
                    ) : null}
                    {row.error ? <p className="text-xs text-red-700">{row.error}</p> : null}
                  </div>
                  <StatusPill status={row.status} />
                </li>
              ))}
            </ul>
          </div>

          {reviewCount > 0 ? (
            <div className="admin-card overflow-x-auto">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-navy">Review before save</h3>
                <button
                  type="button"
                  disabled={pending || !approvedRows.length}
                  className="admin-btn min-h-[44px] text-sm"
                  onClick={saveAllApproved}
                >
                  Save all approved ({approvedRows.length})
                </button>
              </div>
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-xs uppercase text-charcoal/55">
                    <th className="py-2 pr-2">✓</th>
                    <th className="py-2 pr-2">Preview</th>
                    <th className="py-2 pr-2">Vendor</th>
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Total</th>
                    <th className="py-2 pr-2">Tax</th>
                    <th className="py-2 pr-2">Category</th>
                    <th className="py-2 pr-2">Payment</th>
                    <th className="py-2 pr-2">Job</th>
                    <th className="py-2 pr-2">Notes</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows
                    .filter(
                      (r) =>
                        r.status !== "queued" &&
                        !IN_FLIGHT_STATUSES.includes(r.status) &&
                        r.status !== "saving",
                    )
                    .map((row) => (
                      <tr key={row.id} className="border-b border-navy/5 align-top">
                        <td className="py-2 pr-2">
                          <input
                            type="checkbox"
                            checked={row.approved}
                            disabled={row.status === "saved"}
                            onChange={(e) => updateRow(row.id, { approved: e.target.checked })}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          {row.scan?.receipt_url || row.previewUrl ? (
                            <a
                              href={row.scan?.optimized_image_url ?? row.scan?.receipt_url ?? row.previewUrl ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-10 w-10 overflow-hidden rounded"
                            >
                              {row.previewUrl && !row.fileName.toLowerCase().endsWith(".pdf") ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={row.previewUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center bg-sky/30 text-[10px]">
                                  PDF
                                </span>
                              )}
                            </a>
                          ) : (
                            <span className="text-charcoal/40">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            className="admin-input min-w-[100px] py-1 text-xs"
                            value={row.vendor}
                            onChange={(e) => updateRow(row.id, { vendor: e.target.value })}
                            disabled={row.status === "saved"}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="date"
                            className="admin-input min-w-[120px] py-1 text-xs"
                            value={row.expenseDate}
                            onChange={(e) => updateRow(row.id, { expenseDate: e.target.value })}
                            disabled={row.status === "saved"}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            className="admin-input w-20 py-1 text-xs"
                            value={row.total || ""}
                            onChange={(e) => updateRow(row.id, { total: Number(e.target.value) })}
                            disabled={row.status === "saved"}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            className="admin-input w-16 py-1 text-xs"
                            value={row.tax}
                            onChange={(e) =>
                              updateRow(row.id, {
                                tax: e.target.value === "" ? "" : Number(e.target.value),
                              })
                            }
                            disabled={row.status === "saved"}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            className="admin-input min-w-[100px] py-1 text-xs"
                            value={row.category}
                            onChange={(e) => updateRow(row.id, { category: e.target.value })}
                            disabled={row.status === "saved"}
                          >
                            {RECEIPT_EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            className="admin-input min-w-[88px] py-1 text-xs"
                            value={row.paymentMethod}
                            onChange={(e) => updateRow(row.id, { paymentMethod: e.target.value })}
                            disabled={row.status === "saved"}
                          >
                            {PAYMENT_METHODS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          {jobs.length > 0 && !defaultJobId ? (
                            <select
                              className="admin-input min-w-[120px] py-1 text-xs"
                              value={row.jobId}
                              onChange={(e) => updateRow(row.id, { jobId: e.target.value })}
                              disabled={row.status === "saved"}
                            >
                              <option value="">—</option>
                              {jobs.map((j) => (
                                <option key={j.id} value={j.id}>
                                  {j.label.slice(0, 28)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-charcoal/50">
                              {row.jobId ? "Linked" : "—"}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            className="admin-input min-w-[80px] py-1 text-xs"
                            value={row.notes}
                            onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                            disabled={row.status === "saved"}
                          />
                        </td>
                        <td className="py-2">
                          <div className="flex flex-col gap-1">
                            {row.status !== "saved" ? (
                              <>
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-ocean"
                                  disabled={pending || row.saving}
                                  onClick={() => saveOne(row)}
                                >
                                  {row.saving ? "Saving…" : "Save"}
                                </button>
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-charcoal/70"
                                  disabled={pending}
                                  onClick={() => retryRow(row)}
                                >
                                  Retry
                                </button>
                                <button
                                  type="button"
                                  className="text-xs text-red-700"
                                  onClick={() => removeRow(row.id)}
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-green-800">Saved</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
