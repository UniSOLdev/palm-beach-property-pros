"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  getReceiptMigrationDashboardAction,
  pauseReceiptMigrationAction,
  retryFailedReceiptMigrationAction,
  runReceiptMigrationBatchAction,
  startReceiptMigrationAction,
} from "@/lib/admin/actions/receipt-migration";
import { ReceiptProcessingProgress } from "@/components/admin/receipt-processing-progress";

type Dashboard = Awaited<ReturnType<typeof getReceiptMigrationDashboardAction>>;

export function ReceiptMigrationPanel({ initial }: { initial: Dashboard }) {
  const [dash, setDash] = useState(initial);
  const [pending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    startTransition(async () => {
      const next = await getReceiptMigrationDashboardAction();
      setDash(next);
    });
  }, []);

  const runBatchLoop = useCallback(
    async (runId: string) => {
      let done = false;
      while (!done) {
        const batch = await runReceiptMigrationBatchAction(runId);
        refresh();
        done = batch.done || batch.processed === 0;
        if (!done) await new Promise((r) => setTimeout(r, 400));
      }
    },
    [refresh],
  );

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (dash.active?.status === "running" && !dash.active.paused) {
      pollRef.current = setInterval(refresh, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [dash.active?.status, dash.active?.paused, refresh]);

  const active = dash.active;
  const progressPct = active?.total_count
    ? Math.round(
        ((active.completed_count + active.failed_count + active.skipped_count) /
          active.total_count) *
          100,
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Needs upgrade" value={dash.pending_upgrade_count} />
        <StatCard label="Upgraded (run)" value={active?.completed_count ?? 0} />
        <StatCard label="Failed" value={active?.failed_count ?? 0} accent="text-red-700" />
        <StatCard label="In queue" value={active?.queued_count ?? dash.pending_upgrade_count} />
      </div>

      {active ? (
        <div className="admin-card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-charcoal">Migration run</h2>
              <p className="text-sm text-charcoal/60">
                {active.paused ? "Paused" : active.status} · {active.total_count} total receipts
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await pauseReceiptMigrationAction(active.run_id, !active.paused);
                    refresh();
                  })
                }
              >
                {active.paused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={pending || active.failed_count === 0}
                onClick={() =>
                  startTransition(async () => {
                    await retryFailedReceiptMigrationAction(active.run_id);
                    refresh();
                  })
                }
              >
                Retry failed
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={pending || active.paused}
                onClick={() =>
                  startTransition(async () => {
                    await runBatchLoop(active.run_id);
                  })
                }
              >
                Process batch
              </button>
            </div>
          </div>

          <ReceiptProcessingProgress
            status={active.paused ? "queued" : active.status === "completed" ? "completed" : "optimizing"}
            percent={progressPct}
            label={`Migrating receipts (${active.completed_count + active.skipped_count} / ${active.total_count})`}
          />
        </div>
      ) : (
        <div className="admin-card space-y-4 p-5">
          <h2 className="text-lg font-bold text-charcoal">Retroactive upgrade</h2>
          <p className="text-sm text-charcoal/70">
            Scans existing receipts in storage and the database, regenerates OCR-ready JPEGs,
            thumbnails, and corrected orientation — skipping assets already upgraded.
          </p>
          <button
            type="button"
            className="admin-btn"
            disabled={pending || dash.pending_upgrade_count === 0}
            onClick={() =>
              startTransition(async () => {
                const { run_id } = await startReceiptMigrationAction();
                await runBatchLoop(run_id);
              })
            }
          >
            Start migration
          </button>
        </div>
      )}

      <div className="admin-card p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-charcoal/50">Live logs</h3>
        <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
          {dash.logs.length === 0 ? (
            <li className="text-charcoal/50">No migration activity yet.</li>
          ) : (
            dash.logs.map((log) => (
              <li
                key={log.id}
                className={`rounded-lg px-3 py-2 ${
                  log.level === "error"
                    ? "bg-red-50 text-red-900"
                    : log.level === "warn"
                      ? "bg-amber-50 text-amber-900"
                      : "bg-charcoal/5 text-charcoal/80"
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-charcoal/40">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
                <p className="mt-0.5">{log.message}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="admin-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-charcoal/45">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ?? "text-charcoal"}`}>{value}</p>
    </div>
  );
}
