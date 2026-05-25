"use client";

import type { ReceiptProcessingStatus } from "@/lib/receipt/processing-status";
import { PROCESSING_STATUS_LABELS } from "@/lib/receipt/processing-status";

const STEPS: ReceiptProcessingStatus[] = [
  "queued",
  "converting",
  "optimizing",
  "scanning",
  "completed",
];

export function ReceiptProcessingProgress({
  status = "queued",
  percent,
  label,
}: {
  status?: ReceiptProcessingStatus | "failed";
  percent?: number;
  label?: string;
}) {
  const activeIdx =
    status === "failed"
      ? -1
      : STEPS.indexOf(status as ReceiptProcessingStatus);

  const pct =
    percent ??
    (status === "completed"
      ? 100
      : status === "failed"
        ? 0
        : activeIdx <= 0
          ? 8
          : Math.min(95, Math.round(((activeIdx + 1) / STEPS.length) * 100)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-charcoal/70">
        <span>{label ?? PROCESSING_STATUS_LABELS[status as ReceiptProcessingStatus] ?? status}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-charcoal/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            status === "failed" ? "bg-red-500" : "bg-ocean"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((step, i) => {
          const done = status === "completed" || i < activeIdx;
          const current = i === activeIdx && status !== "completed" && status !== "failed";
          return (
            <span
              key={step}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                done
                  ? "bg-green-100 text-green-800"
                  : current
                    ? "bg-ocean/15 text-ocean"
                    : "bg-charcoal/5 text-charcoal/45"
              }`}
            >
              {PROCESSING_STATUS_LABELS[step]}
            </span>
          );
        })}
        {status === "failed" ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-800">
            Failed
          </span>
        ) : null}
      </div>
    </div>
  );
}
