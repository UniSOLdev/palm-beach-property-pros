"use client";

import Link from "next/link";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ExpensePreviewRow } from "@/lib/expense-import";

function fmtMoney(cents: number | null) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type PreviewResponse = {
  row_count: number;
  delimiter: "tab" | "comma";
  headers: string[];
  unmapped_columns: string[];
  previews: ExpensePreviewRow[];
  duplicate_merge_suggestions: { dedupe_key: string; row_indexes: number[]; count: number }[];
  summary: {
    invalid_rows: number;
    duplicate_db_rows: number;
    duplicate_batch_rows: number;
    recurring_rows: number;
  };
  future?: { google_sheets_sync?: string };
};

export function ExpenseImportConsole() {
  const router = useRouter();
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [batchLabel, setBatchLabel] = useState("");
  const [busy, setBusy] = useState<"preview" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [importSource, setImportSource] = useState<"paste" | "csv">("paste");
  const [dragActive, setDragActive] = useState(false);

  const canImport = useMemo(() => {
    if (!preview || busy) return false;
    const hasNew = preview.previews.some((p) => p.valid && !p.duplicate_in_db);
    return Boolean(text.trim()) && hasNew;
  }, [preview, text, busy]);

  const onPreview = useCallback(async () => {
    setError(null);
    setBusy("preview");
    try {
      const res = await fetch("/api/admin/expenses/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed.");
      setPreview(data as PreviewResponse);
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setBusy(null);
    }
  }, [text]);

  const onImport = useCallback(async () => {
    setError(null);
    setBusy("import");
    try {
      const res = await fetch("/api/admin/expenses/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          label: batchLabel.trim() || undefined,
          source: importSource,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      router.push("/admin/expenses?imported=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(null);
    }
  }, [text, batchLabel, importSource, router]);

  const onFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const t = await file.text();
      setText(t);
      setImportSource("csv");
      setPreview(null);
    } catch {
      setError("Could not read that file.");
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Bring your sheet data in</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">
              Paste from Google Sheets or drop a CSV. We auto-map columns, normalize dates, infer categories from
              vendors, match jobs where possible, and block identical rows from being imported twice.
            </p>
          </div>
          <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
            <span className="font-semibold text-sky-200">Coming soon:</span> direct Google Sheets sync.
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor={inputId}>
              Paste spreadsheet (TSV or CSV)
            </label>
            <textarea
              id={inputId}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setImportSource("paste");
                setPreview(null);
              }}
              rows={12}
              placeholder={"Date\tVendor\tAmount\tCategory\n2024-01-15\tHome Depot\t124.50\t"}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 transition placeholder:text-zinc-600 focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!text.trim() || busy !== null}
                onClick={onPreview}
                className="rounded-lg bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === "preview" ? "Analyzing…" : "Run import preview"}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
              >
                Choose CSV file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void onFile(f);
                }}
              />
            </div>
          </div>

          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void onFile(f);
            }}
            className={[
              "flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center transition",
              dragActive ? "border-sky-400/50 bg-sky-500/10" : "border-white/15 bg-black/30",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-zinc-200">Drag & drop CSV</p>
            <p className="mt-2 text-xs text-zinc-500">
              Files are read in your browser. Preview and import use the authenticated admin API — run preview before
              committing.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="batch-label">
              Import label (optional)
            </label>
            <input
              id="batch-label"
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              placeholder="PBPP historical — 2023"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div className="flex items-end">
            <p className="text-xs text-zinc-500">
              Imports are grouped into batches. You can undo a batch from the{" "}
              <Link href="/admin/expenses" className="text-sky-300 underline-offset-2 hover:underline">
                expenses overview
              </Link>{" "}
              without touching other records.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
      ) : null}

      {preview ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill label="Rows parsed" value={String(preview.row_count)} />
            <StatPill label="Invalid rows" value={String(preview.summary.invalid_rows)} tone="warn" />
            <StatPill label="Already in PBPP" value={String(preview.summary.duplicate_db_rows)} />
            <StatPill label="Recurring pattern hints" value={String(preview.summary.recurring_rows)} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/[0.05]">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mapping intelligence</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                Delimiter: <span className="text-zinc-200">{preview.delimiter}</span>
              </span>
              {preview.unmapped_columns.length ? (
                <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-amber-100">
                  Unmapped columns ({preview.unmapped_columns.length}): {preview.unmapped_columns.join(", ")}
                </span>
              ) : (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                  All columns mapped
                </span>
              )}
            </div>
          </div>

          {preview.duplicate_merge_suggestions.length ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
              <p className="text-sm font-semibold text-amber-100">Duplicate merge suggestions</p>
              <p className="mt-1 text-xs text-amber-100/80">
                These rows share an identical fingerprint inside this paste. Only one will import; review the sheet if you
                expected separate purchases.
              </p>
              <ul className="mt-3 space-y-2 text-xs text-amber-50/90">
                {preview.duplicate_merge_suggestions.slice(0, 12).map((s) => (
                  <li key={s.dedupe_key} className="flex flex-wrap justify-between gap-2 rounded-lg border border-amber-400/15 bg-black/20 px-3 py-2">
                    <span>
                      {s.count} rows · sheet lines {s.row_indexes.join(", ")}
                    </span>
                    <span className="font-mono text-[10px] text-amber-200/70">{s.dedupe_key.slice(0, 18)}…</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 ring-1 ring-white/[0.05]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Preview</p>
                <p className="text-xs text-zinc-500">Validation, duplicates, inferred job links, and heuristics before commit.</p>
              </div>
              <button
                type="button"
                disabled={!canImport}
                onClick={onImport}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy === "import" ? "Importing…" : "Commit import"}
              </button>
            </div>
            <div className="max-h-[480px] overflow-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#0a0c10]/95 backdrop-blur">
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2">Pay</th>
                    <th className="px-3 py-2">Job</th>
                    <th className="px-3 py-2">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-200">
                  {preview.previews.map((p) => (
                    <tr
                      key={`${p.rowIndex}-${p.dedupe_key}`}
                      className={[
                        !p.valid ? "bg-rose-500/5" : "",
                        p.duplicate_in_db ? "opacity-60" : "",
                      ].join(" ")}
                    >
                      <td className="px-3 py-2 font-mono text-zinc-500">{p.rowIndex}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{p.expense_date ?? "—"}</td>
                      <td className="px-3 py-2 max-w-[140px] truncate" title={p.vendor ?? ""}>
                        {p.vendor ?? "—"}
                      </td>
                      <td className="px-3 py-2 max-w-[180px] truncate" title={p.item_description ?? ""}>
                        {p.item_description ?? "—"}
                      </td>
                      <td className="px-3 py-2">{p.category ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(p.amount_cents)}</td>
                      <td className="px-3 py-2">{p.payment_method ?? "—"}</td>
                      <td className="px-3 py-2">
                        {p.job_match_label ? (
                          <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-100">
                            {p.job_match_label}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {!p.valid ? <Flag text="Invalid" /> : null}
                          {p.duplicate_in_db ? <Flag text="In PBPP" tone="rose" /> : null}
                          {p.duplicate_in_batch ? <Flag text="Dup row" tone="amber" /> : null}
                          {p.recurring_hint ? <Flag text="Recurring" tone="sky" /> : null}
                          {p.warnings.map((w) => (
                            <Flag key={w} text={w} tone="amber" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div
      className={[
        "rounded-xl border px-4 py-3",
        tone === "warn" ? "border-amber-400/20 bg-amber-500/5" : "border-white/10 bg-white/[0.03]",
      ].join(" ")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function Flag({ text, tone }: { text: string; tone?: "rose" | "amber" | "sky" }) {
  const cls =
    tone === "rose"
      ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
      : tone === "sky"
        ? "border-sky-400/25 bg-sky-500/10 text-sky-100"
        : "border-amber-400/25 bg-amber-500/10 text-amber-100";
  return <span className={["rounded-full border px-2 py-0.5 text-[10px]", cls].join(" ")}>{text}</span>;
}
