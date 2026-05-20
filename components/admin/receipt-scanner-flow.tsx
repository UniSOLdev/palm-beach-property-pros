"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { extractReceiptAction, saveScannedExpenseAction } from "@/lib/admin/actions/receipt-scanner";
import { RECEIPT_EXPENSE_CATEGORIES } from "@/lib/admin/receipt-categories";
import type { ReceiptExtractionResult } from "@/lib/admin/receipt-extraction";
import { PAYMENT_METHODS } from "@/lib/admin/constants";
import { uploadAdminFile } from "@/lib/admin/upload";

type JobOption = { id: string; label: string };

type Phase = "pick" | "uploading" | "scanning" | "confirm" | "manual";

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
  const [error, setError] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ReceiptExtractionResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const lowConfidence = extraction != null && extraction.confidence < 0.55;

  function applyExtraction(ext: ReceiptExtractionResult) {
    setExtraction(ext);
    setVendor(ext.vendor);
    setExpenseDate(ext.expense_date);
    setAmount(ext.amount);
    setTaxAmount(ext.tax_amount ?? "");
    setSubtotal(ext.subtotal ?? "");
    setCategory(ext.category);
    setPaymentMethod(ext.payment_method);
    setDescription(ext.description);
    setNotes(ext.notes ?? "");
  }

  function handleFile(file: File) {
    setError("");
    const preview = URL.createObjectURL(file);
    setReceiptPreview(preview);
    setPhase("uploading");

    startTransition(async () => {
      try {
        const prefix = defaultJobId ? `jobs/${defaultJobId}` : storagePrefix;
        const uploaded = await uploadAdminFile("receipts", file, prefix);
        setReceiptUrl(uploaded.publicUrl);
        setReceiptPath(uploaded.path);
        setPhase("scanning");

        const result = await extractReceiptAction(uploaded.publicUrl);
        applyExtraction(result);

        if (result.extraction_method === "unavailable" || result.error_message) {
          setError(result.error_message ?? "Scan unavailable — review and enter manually.");
          setPhase("confirm");
        } else {
          setPhase("confirm");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload or scan failed");
        setPhase("manual");
      }
    });
  }

  function resetToPick() {
    setPhase("pick");
    setReceiptPreview(null);
    setReceiptUrl(null);
    setReceiptPath(null);
    setExtraction(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  if (phase === "pick") {
    return (
      <div className="admin-card space-y-4">
        <h2 className="text-lg font-bold text-navy">Scan receipt</h2>
        <p className="text-sm text-charcoal/70">
          Take a photo or upload an image. We&apos;ll extract details for you to review before saving.
        </p>
        <label className="flex min-h-[56px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-ocean/40 bg-sky/20 px-4 py-6 text-center font-semibold text-navy">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          📷 Take photo or choose file
        </label>
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
        <p className="text-sm font-semibold text-navy">
          {phase === "uploading" ? "Uploading receipt…" : "Scanning receipt…"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      {error ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>
      ) : null}
      {lowConfidence ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Please review before saving — scan confidence is low.
        </p>
      ) : extraction?.confidence ? (
        <p className="text-xs text-charcoal/55">
          Scan confidence: {Math.round(extraction.confidence * 100)}%
        </p>
      ) : null}

      <div className="admin-card space-y-3">
        <h2 className="text-lg font-bold text-navy">Confirm expense</h2>
        {receiptPreview || receiptUrl ? (
          <a href={receiptUrl ?? receiptPreview ?? "#"} target="_blank" rel="noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptPreview ?? receiptUrl ?? ""}
              alt="Receipt"
              className="max-h-40 w-full rounded-xl object-contain bg-cream/50"
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
                    receipt_url: receiptUrl,
                    receipt_storage_path: receiptPath,
                    job_id: jobId || defaultJobId || null,
                    notes: notes || null,
                    reimbursable,
                    tax_amount: taxAmount === "" ? null : Number(taxAmount),
                    subtotal: subtotal === "" ? null : Number(subtotal),
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
            <button type="button" disabled={pending} className="admin-btn-secondary min-h-[48px]" onClick={resetToPick}>
              Rescan
            </button>
            <button
              type="button"
              className="admin-btn-secondary min-h-[48px]"
              onClick={() => {
                onCancel?.();
                resetToPick();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
