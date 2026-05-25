"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { retryReceiptScanAction, saveScannedExpenseAction } from "@/lib/admin/actions/receipt-scanner";
import { RECEIPT_EXPENSE_CATEGORIES } from "@/lib/admin/receipt-categories";
import { PAYMENT_METHODS } from "@/lib/admin/constants";
import type { ReceiptScanResponse } from "@/lib/receipt/scan-types";
import { confidenceTier } from "@/lib/receipt/scan-types";

type JobOption = { id: string; label: string };

type Phase = "pick" | "uploading" | "scanning" | "confirm";

const PROGRESS_LABELS: Record<Phase, string> = {
  pick: "",
  uploading: "Uploading & optimizing…",
  scanning: "Running OCR…",
  confirm: "",
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const tier = confidenceTier(confidence);
  const pct = Math.round(confidence * 100);
  const styles =
    tier === "high"
      ? "bg-green-100 text-green-900"
      : tier === "medium"
        ? "bg-amber-100 text-amber-900"
        : "bg-orange-100 text-orange-900";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles}`}>
      Scan {pct}% · {tier}
    </span>
  );
}

export function ReceiptScannerFlow({
  defaultJobId,
  jobs = [],
  onCancel,
  onSaved,
  storagePrefix = "expenses",
}: {
  defaultJobId?: string;
  jobs?: JobOption[];
  onCancel?: () => void;
  onSaved?: () => void;
  storagePrefix?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("pick");
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [scan, setScan] = useState<ReceiptScanResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [vendor, setVendor] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState<number | "">("");
  const [subtotal, setSubtotal] = useState<number | "">("");
  const [category, setCategory] = useState<string>("Misc");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [jobId, setJobId] = useState(defaultJobId ?? "");
  const [reimbursable, setReimbursable] = useState(false);

  const applyScan = useCallback((result: ReceiptScanResponse) => {
    setScan(result);
    setVendor(result.vendor);
    setExpenseDate(result.date);
    setAmount(result.total);
    setTaxAmount(result.tax > 0 ? result.tax : "");
    setSubtotal(result.subtotal > 0 ? result.subtotal : "");
    setCategory(result.suggested_category);
    setPaymentMethod(result.payment_method);
    setDescription(result.description || result.vendor);
    setNotes(result.notes ?? "");
    setWarnings(result.warnings ?? []);
    if (result.suggested_job_id && !defaultJobId) {
      setJobId(result.suggested_job_id);
    }
    if (result.optimized_image_url) {
      setReceiptPreview(result.optimized_image_url);
    }
  }, [defaultJobId]);

  async function runScan(file: File) {
    setError("");
    setWarnings([]);
    setUploadPct(10);
    setPhase("uploading");

    const preview = URL.createObjectURL(file);
    setReceiptPreview(preview);

    const form = new FormData();
    form.append("file", file);
    form.append("pathPrefix", storagePrefix);
    if (defaultJobId) form.append("jobId", defaultJobId);

    setUploadPct(35);
    setPhase("scanning");

    const res = await fetch("/api/admin/expenses/scan", {
      method: "POST",
      body: form,
    });

    setUploadPct(90);
    const body = (await res.json()) as ReceiptScanResponse & { error?: string };

    if (!res.ok && body.success === false) {
      setError(body.error ?? body.warnings?.[0] ?? "Scan failed — you can still enter details manually.");
      if (body.warnings?.length) setWarnings(body.warnings);
      applyScan({
        ...body,
        success: true,
        receipt_url: null,
        optimized_image_url: null,
        receipt_storage_path: "",
        optimized_storage_path: null,
        scan_status: "partial",
        ocr_version: "fallback",
        description: "",
        suggested_job_label: "",
        card_last4: null,
        receipt_number: "",
      } as ReceiptScanResponse);
      setPhase("confirm");
      setUploadPct(100);
      return;
    }

    applyScan(body);
    if (body.warnings?.length) setWarnings(body.warnings);
    setPhase("confirm");
    setUploadPct(100);
  }

  function handleFile(file: File) {
    startTransition(async () => {
      try {
        await runScan(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload or scan failed");
        setPhase("confirm");
      }
    });
  }

  function resetToPick() {
    setPhase("pick");
    setReceiptPreview(null);
    setScan(null);
    setError("");
    setWarnings([]);
    setUploadPct(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (phase === "pick") {
    return (
      <div className="admin-card space-y-4">
        <h2 className="text-lg font-bold text-navy">Scan receipt</h2>
        <p className="text-sm text-charcoal/70">
          Photo, HEIC, or PDF. We optimize the image, run OCR, and let you review before saving.
        </p>
        <div
          ref={dropRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="rounded-xl border-2 border-dashed border-ocean/40 bg-sky/20 p-6 text-center"
        >
          <label className="flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-2 font-semibold text-navy">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,image/heic,image/heif,.heic,.heif,application/pdf"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <span className="text-2xl">📷</span>
            <span>Take photo, choose file, or drop here</span>
            <span className="text-xs font-normal text-charcoal/55">JPG, PNG, HEIC, PDF · max 12 MB</span>
          </label>
        </div>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="admin-btn-secondary w-full min-h-[48px]">
            Cancel
          </button>
        ) : null}
      </div>
    );
  }

  if (phase === "uploading" || phase === "scanning") {
    return (
      <div className="admin-card space-y-4 text-center">
        {receiptPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receiptPreview} alt="Receipt" className="mx-auto max-h-48 rounded-xl object-contain" />
        ) : null}
        <p className="text-sm font-semibold text-navy">{PROGRESS_LABELS[phase]}</p>
        <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-sky/40">
          <div
            className="h-full rounded-full bg-ocean transition-all duration-300"
            style={{ width: `${uploadPct}%` }}
          />
        </div>
      </div>
    );
  }

  const tier = scan ? confidenceTier(scan.confidence) : "low";

  return (
    <div className="space-y-4 pb-28">
      {error ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>
      ) : null}
      {warnings.map((w) => (
        <p key={w} className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {w}
        </p>
      ))}
      {scan ? (
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceBadge confidence={scan.confidence} />
          {scan.suggested_job_label ? (
            <span className="text-xs text-charcoal/60">Suggested job: {scan.suggested_job_label}</span>
          ) : null}
        </div>
      ) : null}
      {tier === "low" && !error ? (
        <p className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          Partial extraction — verify amounts and vendor before saving.
        </p>
      ) : null}

      <div className="admin-card space-y-3">
        <h2 className="text-lg font-bold text-navy">Review & save</h2>
        {receiptPreview || scan?.optimized_image_url || scan?.receipt_url ? (
          <a
            href={scan?.optimized_image_url ?? scan?.receipt_url ?? receiptPreview ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scan?.optimized_image_url ?? receiptPreview ?? scan?.receipt_url ?? ""}
              alt="Receipt"
              className="max-h-48 w-full rounded-xl object-contain bg-cream/50"
            />
          </a>
        ) : null}

        <label className="block text-sm font-medium text-navy">
          Vendor
          <input className="admin-input" value={vendor} onChange={(e) => setVendor(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-navy">
          Date
          <input
            type="date"
            className="admin-input"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Total amount
          <input
            type="number"
            step="0.01"
            min={0}
            className="admin-input"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-medium text-navy">
            Subtotal
            <input
              type="number"
              step="0.01"
              className="admin-input"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Optional"
            />
          </label>
          <label className="block text-sm font-medium text-navy">
            Tax
            <input
              type="number"
              step="0.01"
              className="admin-input"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Optional"
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-navy">
          Category
          <select className="admin-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {RECEIPT_EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-navy">
          Payment method
          <select className="admin-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        {!defaultJobId && jobs.length > 0 ? (
          <label className="block text-sm font-medium text-navy">
            Link to job (optional)
            <select className="admin-input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">No job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                  {j.id === scan?.suggested_job_id ? " ★ suggested" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : defaultJobId ? (
          <p className="text-xs text-charcoal/60">Linked to current job</p>
        ) : null}
        <label className="block text-sm font-medium text-navy">
          Description
          <input
            className="admin-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Notes
          <textarea className="admin-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="flex min-h-[48px] items-center gap-3 text-sm font-medium text-navy">
          <input
            type="checkbox"
            checked={reimbursable}
            onChange={(e) => setReimbursable(e.target.checked)}
            className="h-5 w-5"
          />
          Reimbursable
        </label>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-navy/10 bg-cream/95 px-3 py-2 backdrop-blur-md pb-safe">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <button
            type="button"
            disabled={pending || !vendor.trim() || amount <= 0}
            className="admin-btn min-h-[52px] w-full"
            onClick={() =>
              startTransition(async () => {
                setError("");
                try {
                  await saveScannedExpenseAction({
                    expense_date: expenseDate,
                    category,
                    vendor: vendor.trim(),
                    description: description.trim() || vendor.trim(),
                    amount,
                    payment_method: paymentMethod,
                    receipt_url: scan?.receipt_url ?? null,
                    receipt_storage_path: scan?.receipt_storage_path ?? null,
                    optimized_image_url: scan?.optimized_image_url ?? null,
                    job_id: jobId || defaultJobId || null,
                    notes: notes || null,
                    reimbursable,
                    tax_amount: taxAmount === "" ? null : Number(taxAmount),
                    subtotal: subtotal === "" ? null : Number(subtotal),
                    receipt_id: scan?.receipt_id ?? null,
                    scan_confidence: scan?.confidence ?? null,
                    scan_status: scan?.scan_status ?? "manual",
                    ocr_version: scan?.ocr_version ?? null,
                  });
                  onSaved?.();
                  router.refresh();
                  resetToPick();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not save expense");
                }
              })
            }
          >
            Save expense
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={pending || !scan?.receipt_storage_path}
              className="admin-btn-secondary min-h-[48px]"
              onClick={() =>
                startTransition(async () => {
                  if (!scan?.receipt_storage_path) return;
                  setError("");
                  setPhase("scanning");
                  try {
                    const result = await retryReceiptScanAction(scan.receipt_storage_path);
                    applyScan({ ...result, receipt_url: scan.receipt_url, optimized_image_url: scan.optimized_image_url, receipt_storage_path: scan.receipt_storage_path, optimized_storage_path: scan.optimized_storage_path, receipt_id: scan.receipt_id });
                    setPhase("confirm");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Rescan failed");
                    setPhase("confirm");
                  }
                })
              }
            >
              Retry scan
            </button>
            <button type="button" disabled={pending} className="admin-btn-secondary min-h-[48px]" onClick={resetToPick}>
              New receipt
            </button>
          </div>
          {onCancel ? (
            <button
              type="button"
              className="admin-btn-secondary min-h-[48px] w-full"
              onClick={() => {
                onCancel();
                resetToPick();
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
