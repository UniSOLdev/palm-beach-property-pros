export const dynamic = "force-dynamic";

import Link from "next/link";
import { formatUsd, loadOpsDashboardMetrics, type OpsActivityItem } from "@/lib/ops/analytics";

export const metadata = {
  title: "Operations",
};

function prettyDate(iso: string): string {
  if (!iso) return "Recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function activityAccent(type: OpsActivityItem["type"]): string {
  if (type === "invoice") return "bg-emerald-400";
  if (type === "expense") return "bg-amber-400";
  if (type === "task") return "bg-violet-400";
  return "bg-sky-400";
}

export default async function AdminDashboardPage() {
  const metrics = await loadOpsDashboardMetrics().catch((e) => ({
    error: e instanceof Error ? e.message : "Could not reach Supabase.",
  }));

  const hasMetrics = !("error" in metrics);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-400/90">Command center</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">PBPP Operations</h1>
          <p className="mt-1 text-sm text-zinc-500">Live jobs, invoices, tasks, crew, expenses, and website operations.</p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:grid-flow-col sm:auto-cols-max">
          <Link href="/admin/jobs" className="min-h-[44px] rounded-xl border border-white/15 px-5 py-2.5 text-center text-sm font-semibold text-zinc-100 no-underline transition hover:bg-white/5">
            Open jobs
          </Link>
          <Link href="/admin/expenses/import" className="min-h-[44px] rounded-xl border border-white/15 px-5 py-2.5 text-center text-sm font-semibold text-zinc-100 no-underline transition hover:bg-white/5">
            Import expenses
          </Link>
          <Link href="/admin/invoices/new" className="min-h-[44px] rounded-xl bg-sky-500/90 px-5 py-2.5 text-center text-sm font-semibold text-sky-950 no-underline shadow-lg shadow-sky-900/25 transition hover:bg-sky-400">
            New invoice
          </Link>
        </div>
      </div>

      {!hasMetrics ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {metrics.error}
        </p>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-white/[0.04] to-sky-500/10 p-6 ring-1 ring-emerald-400/15">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80">Profit signal</p>
                  <p className="mt-2 text-4xl font-semibold tabular-nums text-white">{formatUsd(metrics.profit_signal_cents)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
                  <p className="text-xs text-zinc-500">Margin</p>
                  <p className="text-2xl font-semibold text-white">{metrics.profit_margin_percent}%</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricMini label="Paid invoices" value={formatUsd(metrics.paid_invoice_cents)} />
                <MetricMini label="Open balances" value={formatUsd(metrics.open_invoice_cents)} />
                <MetricMini label="Expenses" value={formatUsd(metrics.expense_cents)} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Today overview</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricMini label="Active jobs" value={String(metrics.active_jobs)} />
                <MetricMini label="Open tasks" value={String(metrics.open_tasks)} />
                <MetricMini label="Due today" value={String(metrics.tasks_due_today)} />
                <MetricMini label="Crew active" value={String(metrics.crew_active)} />
              </div>
              {(metrics.blocked_tasks > 0 || metrics.low_stock > 0) ? (
                <div className="mt-4 space-y-2">
                  {metrics.blocked_tasks > 0 ? <AlertPill tone="red">{metrics.blocked_tasks} blocked task{metrics.blocked_tasks === 1 ? "" : "s"}</AlertPill> : null}
                  {metrics.low_stock > 0 ? <AlertPill tone="amber">{metrics.low_stock} low-stock SKU{metrics.low_stock === 1 ? "" : "s"}</AlertPill> : null}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">No critical operational alerts.</p>
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="CRM clients" value={metrics.clients} href="/admin/clients" />
            <MetricCard label="Jobs" value={metrics.jobs} href="/admin/jobs" />
            <MetricCard label="Invoices" value={metrics.invoices} href="/admin/invoices" />
            <MetricCard label="Expenses" value={metrics.expense_count} href="/admin/expenses" />
            <MetricCard label="Inventory alerts" value={metrics.low_stock} href="/admin/supplies" />
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Upcoming jobs</h2>
                <Link href="/admin/jobs" className="text-xs font-semibold text-sky-300 no-underline hover:underline">View board</Link>
              </div>
              <div className="mt-4 space-y-3">
                {metrics.upcoming_jobs.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">No active jobs on the board.</p>
                ) : metrics.upcoming_jobs.map((job) => (
                  <Link key={job.id} href={`/admin/jobs/${job.id}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 no-underline transition hover:border-sky-400/30 hover:bg-sky-500/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{job.job_number ?? "Job"} · {job.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{job.property_address ?? "No property address"}</p>
                      </div>
                      <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-100">{job.status.replace(/_/g, " ")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Recent activity</h2>
                <span className="text-xs text-zinc-500">Jobs · tasks · invoices · expenses</span>
              </div>
              <div className="mt-4 space-y-3">
                {metrics.recent_activity.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">Activity will appear as crews update jobs, tasks, invoices, and expenses.</p>
                ) : metrics.recent_activity.map((item) => (
                  <Link key={item.id} href={item.href} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 no-underline transition hover:border-sky-400/30 hover:bg-sky-500/5">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${activityAccent(item.type)}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">{item.meta} · {prettyDate(item.occurred_at)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 ring-1 ring-white/[0.05]">
            <h2 className="text-sm font-semibold text-white">Quick workflows</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <WorkflowLink href="/admin/jobs">Jobs board</WorkflowLink>
              <WorkflowLink href="/admin/expenses/import">CSV expense import</WorkflowLink>
              <WorkflowLink href="/admin/crew">Crew workload</WorkflowLink>
              <WorkflowLink href="/admin/website">Website manager</WorkflowLink>
              <WorkflowLink href="/admin/clients">Client CRM</WorkflowLink>
              <WorkflowLink href="/admin/invoices">Invoice tracking</WorkflowLink>
              <WorkflowLink href="/admin/supplies">Ops inventory</WorkflowLink>
              <WorkflowLink href="/admin/invoices/new">Create invoice</WorkflowLink>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 no-underline ring-1 ring-white/[0.06] transition hover:border-sky-400/30 hover:bg-sky-500/5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{value}</p>
    </Link>
  );
}

function AlertPill({ tone, children }: { tone: "red" | "amber"; children: React.ReactNode }) {
  const cls = tone === "red"
    ? "border-red-400/30 bg-red-500/10 text-red-100"
    : "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return <p className={`rounded-xl border px-3 py-2 text-sm ${cls}`}>{children}</p>;
}

function WorkflowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="min-h-[44px] rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-200 no-underline transition hover:border-sky-400/30 hover:bg-sky-500/5">
      {children}
    </Link>
  );
}
