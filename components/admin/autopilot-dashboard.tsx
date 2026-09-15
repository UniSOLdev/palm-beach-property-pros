"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getAutopilotDashboard, runAutopilotJob } from "@/lib/autopilot/actions/dashboard";
import type { AutopilotDashboardData } from "@/lib/autopilot/dashboard-constants";
import type { AutomationRunStatus, CommsStatus } from "@/lib/autopilot/types";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusChip(status: AutomationRunStatus | CommsStatus) {
  switch (status) {
    case "completed":
    case "sent":
    case "delivered":
      return "bg-emerald-100 text-emerald-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "running":
    case "queued":
      return "bg-sky-100 text-sky-800";
    case "skipped":
      return "bg-charcoal/10 text-charcoal/70";
    default:
      return "bg-charcoal/10 text-charcoal/70";
  }
}

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-charcoal/60">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="admin-card block no-underline transition hover:shadow-lg">
        {inner}
      </Link>
    );
  }

  return <div className="admin-card">{inner}</div>;
}

export function AutopilotDashboard({ initial }: { initial: AutopilotDashboardData }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [runMessage, setRunMessage] = useState("");

  function refresh() {
    startTransition(async () => {
      try {
        setError("");
        setData(await getAutopilotDashboard());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Refresh failed");
      }
    });
  }

  function handleRunNow(jobKey: string) {
    startTransition(async () => {
      try {
        setError("");
        setRunMessage("");
        const result = await runAutopilotJob(jobKey);
        if (result.ok) {
          setRunMessage(
            `${jobKey}: ${result.skipped ? "skipped (already ran)" : "completed"} · created ${result.created}, updated ${result.updated}`,
          );
        } else {
          setError(result.errors.join("; ") || `${jobKey} failed`);
        }
        setData(await getAutopilotDashboard());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Run failed");
      }
    });
  }

  const enabledRules = data.taskRules.filter((r) => r.enabled).length;
  const { tierSummary } = data;
  const isFree = tierSummary.tier === "free";

  const featureRows = [
    { label: "Task rules", ...tierSummary.features.taskRules },
    { label: "Email (Resend)", ...tierSummary.features.email },
    { label: "SMS", ...tierSummary.features.sms },
    { label: "Voice receptionist", ...tierSummary.features.voice },
    { label: "Stripe payments", ...tierSummary.features.stripe },
    { label: "AI copy", ...tierSummary.features.openAi },
  ] as const;

  return (
    <div className="space-y-4 pb-8">
      <div className="admin-card space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean">
            PBPP Autopilot
          </p>
          <h1 className="text-xl font-bold text-navy">Autopilot OS</h1>
          <p className="text-sm text-charcoal/70">
            {isFree
              ? "Free tier — automated tasks, email, outreach drafts, and weekly digest."
              : "Paid tier — full automation including SMS, payments, and AI copy when configured."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="admin-btn-secondary min-h-[44px] px-4 py-2 text-xs"
            onClick={refresh}
            disabled={pending}
          >
            Refresh
          </button>
          {data.hasContentPage ? (
            <Link href="/admin/autopilot/content" className="admin-btn-secondary min-h-[44px] px-4 py-2 text-xs">
              Content queue
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
      {runMessage ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{runMessage}</p>
      ) : null}

      <section className="admin-card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-navy">Plan</h2>
          <span
            className={`admin-chip ${isFree ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}
          >
            {isFree ? "Free tier" : "Paid tier"}
          </span>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {featureRows.map((row) => (
            <li
              key={row.label}
              className="rounded-xl border border-navy/10 px-3 py-2.5 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-navy">{row.label}</p>
                <span
                  className={`admin-chip ${
                    row.enabled ? "bg-emerald-100 text-emerald-800" : "bg-charcoal/10 text-charcoal/60"
                  }`}
                >
                  {row.enabled ? "on" : "off"}
                </span>
              </div>
              {row.reason && !row.enabled ? (
                <p className="mt-1 text-xs text-charcoal/55">{row.reason}</p>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="text-xs text-charcoal/55">{tierSummary.cronHint}</p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Outreach pending"
          value={data.pendingOutreachCount}
          hint="Active enrollments awaiting approval"
        />
        <StatCard
          label="Content drafts"
          value={data.pendingContentDraftsCount}
          hint="Draft or pending review"
          href={data.hasContentPage ? "/admin/autopilot/content" : undefined}
        />
        <StatCard
          label="Receptionist today"
          value={isFree ? "—" : data.receptionistSessionsToday}
          hint={isFree ? "Paid tier + Twilio" : "SMS / voice sessions"}
        />
        <StatCard
          label="Task rules"
          value={`${enabledRules}/${data.taskRules.length}`}
          hint="Enabled automation rules"
        />
      </div>

      <section className="admin-card space-y-3">
        <div>
          <h2 className="text-base font-bold text-navy">Cron jobs</h2>
          <p className="text-xs text-charcoal/60">Last run status and manual triggers (server-side engines).</p>
        </div>
        <ul className="space-y-2">
          {data.cronJobs.map((job) => {
            const last = data.lastRunByJob[job.key];
            return (
              <li
                key={job.key}
                className="flex flex-col gap-2 rounded-xl border border-navy/10 bg-sky/10 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">{job.label}</p>
                    {last ? (
                      <span className={`admin-chip ${statusChip(last.status)}`}>{last.status}</span>
                    ) : (
                      <span className="admin-chip bg-charcoal/10 text-charcoal/60">never run</span>
                    )}
                  </div>
                  <p className="text-xs text-charcoal/60">
                    {job.schedule} · {job.description}
                  </p>
                  {last ? (
                    <p className="mt-1 text-[11px] text-charcoal/50">
                      Last: {formatWhen(last.completed_at ?? last.started_at)}
                      {last.error ? ` · ${last.error}` : ""}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="admin-btn min-h-[44px] shrink-0 px-4 py-2 text-xs"
                  disabled={pending}
                  onClick={() => handleRunNow(job.key)}
                >
                  Run now
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="admin-card space-y-3">
        <h2 className="text-base font-bold text-navy">Recent automation runs</h2>
        {data.recentRuns.length === 0 ? (
          <p className="text-sm text-charcoal/60">No runs logged yet. Trigger a job or wait for Vercel cron.</p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {data.recentRuns.slice(0, 15).map((run) => (
              <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <span className="font-medium text-navy">{run.job_key}</span>
                  <span className="ml-2 text-xs text-charcoal/50">{run.run_key}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`admin-chip ${statusChip(run.status)}`}>{run.status}</span>
                  <span className="text-xs text-charcoal/50">{formatWhen(run.started_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-card space-y-3">
        <h2 className="text-base font-bold text-navy">Task rules</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {data.taskRules.map((rule) => (
            <li
              key={rule.id}
              className="rounded-xl border border-navy/10 px-3 py-2.5 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-navy">{rule.name}</p>
                <span
                  className={`admin-chip ${
                    rule.enabled ? "bg-emerald-100 text-emerald-800" : "bg-charcoal/10 text-charcoal/60"
                  }`}
                >
                  {rule.enabled ? "on" : "off"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-charcoal/50">
                {rule.category} · {rule.priority} · {rule.rule_key}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card space-y-3">
        <h2 className="text-base font-bold text-navy">Recent comms</h2>
        {data.commsLog.length === 0 ? (
          <p className="text-sm text-charcoal/60">No messages logged yet.</p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {data.commsLog.map((entry) => (
              <li key={entry.id} className="py-2.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">
                      {entry.channel.toUpperCase()} → {entry.recipient}
                    </p>
                    <p className="truncate text-xs text-charcoal/60">
                      {entry.template_key ?? "custom"}
                      {entry.subject ? ` · ${entry.subject}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`admin-chip ${statusChip(entry.status)}`}>{entry.status}</span>
                    <span className="text-xs text-charcoal/50">{formatWhen(entry.created_at)}</span>
                  </div>
                </div>
                {entry.body_preview ? (
                  <p className="mt-1 line-clamp-2 text-xs text-charcoal/50">{entry.body_preview}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
