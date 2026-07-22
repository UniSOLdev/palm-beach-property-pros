"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { rescheduleJob, updateJobStatus, type ScheduledJob } from "@/lib/admin/actions/scheduling";
import { JOB_STATUS_COLORS, JOB_STATUSES, googleMapsDirectionsUrl } from "@/lib/platform/constants";

type ViewMode = "day" | "week" | "month";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function JobScheduler({ jobs, initialDate }: { jobs: ScheduledJob[]; initialDate: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<ViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [dragJobId, setDragJobId] = useState<string | null>(null);

  const range = useMemo(() => {
    if (view === "day") return [anchorDate];
    const days = view === "week" ? 7 : 30;
    return Array.from({ length: days }, (_, i) => addDays(anchorDate, i));
  }, [anchorDate, view]);

  const grouped = useMemo(() => {
    const map = new Map<string, ScheduledJob[]>();
    for (const day of range) map.set(day, []);
    for (const job of jobs) {
      if (!map.has(job.job_date)) continue;
      map.get(job.job_date)!.push(job);
    }
    return map;
  }, [jobs, range]);

  function moveJob(jobId: string, newDate: string) {
    startTransition(async () => {
      await rescheduleJob(jobId, { job_date: newDate });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        {(["day", "week", "month"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setView(mode)}
            className={`min-h-[44px] rounded-full px-4 text-sm font-semibold capitalize ${
              view === mode ? "bg-navy text-cream" : "border border-navy/15 bg-white text-navy"
            }`}
          >
            {mode}
          </button>
        ))}
        <button
          type="button"
          className="admin-btn-secondary min-h-[44px] px-3 text-xs"
          onClick={() => setAnchorDate(dateKey(new Date()))}
        >
          Today
        </button>
      </div>

      <div className="space-y-4">
        {range.map((day) => (
          <section
            key={day}
            className={`admin-card ${dragJobId ? "ring-2 ring-ocean/20" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragJobId) {
                moveJob(dragJobId, day);
                setDragJobId(null);
              }
            }}
          >
            <h2 className="text-sm font-bold text-navy">
              {new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </h2>
            <ul className="mt-3 space-y-2">
              {(grouped.get(day) ?? []).length ? (
                grouped.get(day)!.map((job) => (
                  <li
                    key={job.id}
                    draggable
                    onDragStart={() => setDragJobId(job.id)}
                    className="rounded-xl border border-navy/10 bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-navy">{job.clients?.name ?? "Client"}</p>
                        <p className="text-xs text-charcoal/70">{job.service_type}</p>
                        <p className="mt-1 text-xs text-charcoal/60">{job.start_time ?? "Time TBD"}</p>
                      </div>
                      <span className={`admin-chip ${JOB_STATUS_COLORS[job.status] ?? "bg-charcoal/10"}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={googleMapsDirectionsUrl(job.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn-secondary min-h-[40px] px-3 text-xs no-underline"
                      >
                        Navigate
                      </a>
                      <Link href={`/admin/jobs/${job.id}/field`} className="admin-btn min-h-[40px] px-3 text-xs no-underline">
                        Field mode
                      </Link>
                      <select
                        value={job.status}
                        disabled={pending}
                        onChange={(e) =>
                          startTransition(async () => {
                            await updateJobStatus(job.id, e.target.value);
                            router.refresh();
                          })
                        }
                        className="min-h-[40px] rounded-xl border border-navy/15 px-2 text-xs"
                      >
                        {JOB_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-navy/15 px-3 py-6 text-center text-sm text-charcoal/60">
                  Drop a job here
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
