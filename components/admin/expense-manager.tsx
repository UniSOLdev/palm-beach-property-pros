"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ReceiptScannerFlow } from "@/components/admin/receipt-scanner-flow";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { createExpense } from "@/lib/admin/actions/expenses";
import type { CrewOption } from "@/lib/admin/types";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/admin/constants";
import { uploadAdminFile } from "@/lib/admin/upload";
import { formatCurrency, formatDate } from "@/lib/admin/format";

type JobOption = { id: string; label: string };

type Expense = {
  id: string;
  expense_date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  reimbursable: boolean;
};

export function ExpenseManager({
  initial,
  crew,
  jobs = [],
  initialFocus,
}: {
  initial: Expense[];
  crew: CrewOption[];
  jobs?: JobOption[];
  initialFocus?: "form" | "receipt" | "scan" | null;
}) {
  const [pending, startTransition] = useTransition();
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(
    initialFocus === "receipt" || initialFocus === "scan",
  );
  const [showManualForm, setShowManualForm] = useState(initialFocus === "form");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initialFocus === "form") {
      setShowManualForm(true);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (initialFocus === "receipt" || initialFocus === "scan") {
      setShowScanner(true);
    }
  }, [initialFocus]);

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {showScanner ? (
        <ReceiptScannerFlow
          jobs={jobs}
          onCancel={() => setShowScanner(false)}
          onSaved={() => {
            setShowScanner(false);
            window.location.reload();
          }}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="admin-btn min-h-[52px] flex-1"
            onClick={() => {
              setShowScanner(true);
              setShowManualForm(false);
            }}
          >
            📷 Scan receipt
          </button>
          <button
            type="button"
            className="admin-btn-secondary min-h-[52px] flex-1"
            onClick={() => setShowManualForm((v) => !v)}
          >
            {showManualForm ? "Hide manual form" : "Manual entry"}
          </button>
        </div>
      )}

      {showManualForm && !showScanner ? (
        <form
          ref={formRef}
          id="expense-form"
          className="admin-card space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              setError("");
              try {
                let receipt_url: string | null = null;
                const file = (fd.get("receipt") as File | null) ?? null;
                if (file && file.size > 0) {
                  const uploaded = await uploadAdminFile("receipts", file, "expenses");
                  receipt_url = uploaded.publicUrl;
                }
                const linkedJob = String(fd.get("job_id") || "");
                await createExpense({
                  expense_date: String(fd.get("expense_date")),
                  category: String(fd.get("category")),
                  vendor: String(fd.get("vendor")),
                  description: String(fd.get("description")),
                  amount: Number(fd.get("amount")),
                  payment_method: String(fd.get("payment_method")),
                  receipt_url,
                  job_id: linkedJob || null,
                  reimbursable: fd.get("reimbursable") === "on",
                  expense_type: linkedJob ? "Job" : "Operating",
                });
                e.currentTarget.reset();
                setReceiptPreview(null);
                window.location.reload();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not save expense");
              }
            });
          }}
        >
          <h2 className="text-lg font-bold text-navy">Add expense (manual)</h2>
          <input
            type="date"
            name="expense_date"
            required
            className="admin-input"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <select name="category" required className="admin-input" defaultValue="Misc">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input name="vendor" required className="admin-input" placeholder="Vendor" />
          <input name="description" required className="admin-input" placeholder="Description" />
          <input name="amount" type="number" step="0.01" required className="admin-input" placeholder="Amount" />
          <select name="payment_method" className="admin-input" defaultValue="Card">
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {jobs.length > 0 ? (
            <label className="block text-sm font-medium text-navy">
              Link to job (optional)
              <select name="job_id" className="admin-input" defaultValue="">
                <option value="">No job</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex min-h-[48px] items-center gap-2 text-sm font-medium text-navy">
            <input type="checkbox" name="reimbursable" className="h-5 w-5" />
            Reimbursable
          </label>
          <label className="block text-sm font-medium text-navy">
            Receipt photo (optional)
            <input
              type="file"
              name="receipt"
              accept="image/*"
              capture="environment"
              className="admin-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setReceiptPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
          </label>
          {receiptPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={receiptPreview} alt="Receipt preview" className="max-h-40 rounded-xl object-cover" />
          ) : null}
          <button type="submit" disabled={pending} className="admin-btn w-full min-h-[52px]">
            Save expense
          </button>
        </form>
      ) : null}

      <ul className="space-y-3">
        {initial.length === 0 ? (
          <li className="admin-card text-center text-sm text-charcoal/60">No expenses logged yet.</li>
        ) : (
          initial.map((e) => (
            <li key={e.id} className="admin-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy">{e.description}</p>
                  <p className="text-xs text-charcoal/60">
                    {e.category} · {e.vendor} · {formatDate(e.expense_date)}
                  </p>
                </div>
                <p className="font-bold text-navy">{formatCurrency(Number(e.amount))}</p>
              </div>
              {e.receipt_url ? (
                <a href={e.receipt_url} target="_blank" rel="noreferrer" className="mt-2 text-xs font-semibold text-ocean">
                  View receipt
                </a>
              ) : null}
              <div className="mt-3">
                <TaskQuickAdd
                  crew={crew}
                  variant="compact"
                  label="+ Task"
                  defaults={{
                    expense_id: e.id,
                    category: "Expense/Receipt",
                    title: e.receipt_url ? "Link expense to job if applicable" : "Attach receipt image",
                  }}
                />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
