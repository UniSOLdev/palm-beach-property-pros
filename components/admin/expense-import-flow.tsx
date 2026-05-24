"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  detectDuplicateHints,
  parseExpenseCsv,
  parseExpenseXlsx,
  type ExpenseImportRow,
} from "@/lib/admin/expense-import-utils";
import { batchImportExpensesAction, fetchExistingExpenseFingerprints } from "@/lib/admin/actions/expense-import";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { useAdminToast } from "@/components/admin/admin-toast";

type JobOption = { id: string; label: string };

export function ExpenseImportFlow({ jobs = [] }: { jobs?: JobOption[] }) {
  const router = useRouter();
  const { toast } = useAdminToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [rows, setRows] = useState<ExpenseImportRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [jobId, setJobId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        try {
          let parsed;
          if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            parsed = parseExpenseXlsx(reader.result as ArrayBuffer);
          } else {
            parsed = parseExpenseCsv(String(reader.result ?? ""));
          }
          const existing = await fetchExistingExpenseFingerprints();
          const withDupes = detectDuplicateHints(parsed.rows, existing);
          setHeaders(parsed.headers);
          setRows(withDupes);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to parse file");
        }
      });
    };
    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  function importRows(skipInvalid: boolean, skipDuplicates: boolean) {
    setError("");
    startTransition(async () => {
      try {
        const result = await batchImportExpensesAction(rows, {
          skipInvalid,
          skipDuplicates,
          job_id: jobId || null,
        });
        toast(`Imported ${result.imported} expenses`, "success");
        router.push("/admin/expenses");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
        toast("Import failed", "error");
      }
    });
  }

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const dupeCount = rows.filter((r) => r.duplicateHint).length;

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="admin-card space-y-3">
        <p className="text-sm text-charcoal/80">
          Upload CSV or XLSX exports from Home Depot, Chase, Amex, or generic spreadsheets. Columns are auto-mapped.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv"
          capture={false}
          className="w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {jobs.length > 0 ? (
          <label className="block text-sm font-semibold text-navy">
            Attach all rows to job (optional)
            <select
              className="mt-2 w-full min-h-[48px] rounded-xl border border-navy/15 px-3"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              <option value="">Operating expense (no job)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="admin-chip bg-sky/40">{rows.length} rows</span>
            <span className="admin-chip bg-leaf/30">{validCount} valid</span>
            {dupeCount > 0 ? <span className="admin-chip bg-amber-100">{dupeCount} possible dupes</span> : null}
          </div>
          {headers.length > 0 ? (
            <p className="text-xs text-charcoal/50">Detected columns: {headers.join(", ")}</p>
          ) : null}
          <ul className="max-h-[420px] space-y-2 overflow-y-auto">
            {rows.slice(0, 50).map((row) => (
              <li
                key={row.rowIndex}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  row.errors.length ? "border-red-200 bg-red-50/50" : "border-navy/10 bg-white"
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-navy">{row.vendor}</span>
                  <span>{formatCurrency(row.amount)}</span>
                </div>
                <p className="text-xs text-charcoal/60">
                  {formatDate(row.expense_date)} · {row.category} · {row.payment_method}
                </p>
                {row.errors.length ? (
                  <p className="text-xs text-red-700">{row.errors.join("; ")}</p>
                ) : null}
                {row.duplicateHint ? <p className="text-xs text-amber-800">{row.duplicateHint}</p> : null}
              </li>
            ))}
          </ul>
          {rows.length > 50 ? (
            <p className="text-xs text-charcoal/50">Showing first 50 of {rows.length} rows.</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="admin-btn min-h-[48px]" disabled={pending} onClick={() => importRows(true, true)}>
              {pending ? "Importing…" : "Import valid (skip dupes)"}
            </button>
            <button type="button" className="admin-btn-secondary min-h-[48px]" disabled={pending} onClick={() => importRows(true, false)}>
              Import all valid
            </button>
          </div>
        </>
      ) : null}

      <p className="text-center text-sm">
        <Link href="/admin/expenses/scan" className="font-semibold text-ocean no-underline">
          Scan a receipt instead →
        </Link>
      </p>
    </div>
  );
}
