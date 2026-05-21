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
  if (type === "invoice") return "bg-leaf";
  if (type === "expense") return "bg-sand";
  if (type === "task") return "bg-aqua";
  return "bg-sky";
}

export default async function AdminDashboardPage() {
  const metrics = await loadOpsDashboardMetrics().catch((e) => ({
    error: e instanceof Error ? e.message : "Could not reach Supabase.",
  }));

  const hasMetrics = !("error" in metrics);

  return (
    <div className="admin-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="admin-kicker">Today&apos;s operations</p>
          <h1 className="admin-title mt-2">Palm Beach field OS</h1>
          <p className="admin-subtitle mt-2">A calm view of jobs, crews, tasks, payments, and profit for today&apos;s service work.</p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:grid-flow-col sm:auto-cols-max">
          <Link href="/admin/jobs" className="admin-action-secondary">Open jobs</Link>
          <Link href="/admin/expenses/import" className="admin-action-secondary">Import expenses</Link>
          <Link href="/admin/invoices/new" className="admin-action-primary">New invoice</Link>
        </div>
      </div>

      {!hasMetrics ? (
        <p className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {metrics.error}
        </p>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="admin-card bg-gradient-to-br from-white/[0.08] via-white/[0.045] to-aqua/10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="admin-kicker">Profit signal</p>
                  <p className="mt-3 text-4xl font-semibold tabular-nums text-cream">{formatUsd(metrics.profit_signal_cents)}</p>
                  <p className="mt-2 text-sm text-silver">Paid invoice revenue minus recorded expenses.</p>
                </div>
                <div className="admin-card-flat text-right">
                  <p className="text-xs text-silver">Margin</p>
                  <p className="mt-1 text-2xl font-semibold text-cream">{metrics.profit_margin_percent}%</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricMini label="Paid invoices" value={formatUsd(metrics.paid_invoice_cents)} />
                <MetricMini label="Open balances" value={formatUsd(metrics.open_invoice_cents)} />
                <MetricMini label="Recorded expenses" value={formatUsd(metrics.expense_cents)} />
              </div>
            </div>

            <div className="admin-card">
              <p className="admin-kicker">Field pulse</p>
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
                <p className="mt-4 rounded-2xl border border-leaf/25 bg-leaf/10 px-3 py-2 text-sm text-emerald-100">No critical operational alerts.</p>
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
            <div className="admin-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-cream">Active jobs</h2>
                <Link href="/admin/jobs" className="text-sm font-semibold text-aqua no-underline hover:underline">View board</Link>
              </div>
              <div className="mt-4 space-y-3">
                {metrics.upcoming_jobs.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-silver">No active jobs on the board.</p>
                ) : metrics.upcoming_jobs.map((job) => (
                  <Link key={job.id} href={`/admin/jobs/${job.id}`} className="admin-card-soft block no-underline transition hover:border-aqua/35 hover:bg-aqua/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-cream">{job.job_number ?? "Job"} · {job.title}</p>
                        <p className="mt-1 truncate text-xs text-silver">{job.property_address ?? "No property address"}</p>
                      </div>
                      <span className="admin-pill shrink-0 text-[10px] uppercase tracking-wide">{job.status.replace(/_/g, " ")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="admin-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-cream">Recent activity</h2>
                <span className="text-xs text-silver">Jobs · tasks · invoices · expenses</span>
              </div>
              <div className="mt-4 space-y-3">
                {metrics.recent_activity.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-silver">Activity appears as crews update jobs, tasks, invoices, and expenses.</p>
                ) : metrics.recent_activity.map((item) => (
                  <Link key={item.id} href={item.href} className="admin-card-soft flex items-start gap-3 no-underline transition hover:border-aqua/35 hover:bg-aqua/10">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${activityAccent(item.type)}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-cream">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-silver">{item.meta} · {prettyDate(item.occurred_at)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="admin-card">
            <h2 className="text-base font-semibold text-cream">Core workflows</h2>
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
    <div className="admin-card-flat">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-silver">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-cream">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="admin-card block no-underline transition hover:border-aqua/35 hover:bg-aqua/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-silver">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-cream">{value}</p>
    </Link>
  );
}

function AlertPill({ tone, children }: { tone: "red" | "amber"; children: React.ReactNode }) {
  const cls = tone === "red"
    ? "border-red-300/30 bg-red-400/10 text-red-100"
    : "border-amber-300/30 bg-amber-400/10 text-amber-100";
  return <p className={`rounded-2xl border px-3 py-2 text-sm ${cls}`}>{children}</p>;
}

function WorkflowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="admin-action-secondary justify-start">
      {children}
    </Link>
  );
}
