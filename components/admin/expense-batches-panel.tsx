"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ExpenseBatchListRow = {
  id: string;
  label: string | null;
  source: string;
  row_count: number;
  inserted_count: number;
  skipped_duplicates: number;
  skipped_invalid: number;
  reverted_at: string | null;
  created_at: string;
};

function fmtWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ExpenseBatchesPanel({ batches }: { batches: ExpenseBatchListRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revert(id: string) {
    if (!confirm("Undo this import? Matching expenses from this batch will be removed.")) return;
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/expenses/batches/${encodeURIComponent(id)}/revert`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not undo import.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not undo import.");
    } finally {
      setBusyId(null);
    }
  }

  if (!batches.length) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
        No imports yet. When you bring in historical sheets, each run appears here with a clean undo path.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 ring-1 ring-white/[0.05]">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3 text-right">Inserted</th>
              <th className="px-4 py-3 text-right">Skipped dupes</th>
              <th className="px-4 py-3 text-right">Invalid</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-200">
            {batches.map((b) => {
              const reverted = Boolean(b.reverted_at);
              return (
                <tr key={b.id} className={reverted ? "opacity-50" : ""}>
                  <td className="px-4 py-3 text-xs text-zinc-400">{fmtWhen(b.created_at)}</td>
                  <td className="px-4 py-3 text-sm text-white">{b.label ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{b.source}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.inserted_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-100/90">{b.skipped_duplicates}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-500">{b.skipped_invalid}</td>
                  <td className="px-4 py-3">
                    {reverted ? (
                      <span className="rounded-full border border-zinc-700 bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-400">
                        Undone
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-100">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!reverted && b.inserted_count > 0 ? (
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => void revert(b.id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-50 disabled:cursor-wait disabled:opacity-50"
                      >
                        {busyId === b.id ? "Working…" : "Undo import"}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
