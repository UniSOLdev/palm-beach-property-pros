"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { calculateOpsMetrics } from "@/lib/ops/metrics";
import { opsSnapshot } from "@/lib/ops/sample-data";
import { describeSpreadsheetIngestionPlan, pbppSpreadsheetMappingDraft } from "@/lib/ops/spreadsheet";
import type { OpsJob } from "@/lib/ops/types";

const modules = [
  "Revenue Dashboard",
  "Expense Tracking",
  "Profit Metrics",
  "Jobs Dashboard",
  "CRM Layer",
  "Operations Metrics",
] as const;

export function OpsDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const metrics = useMemo(() => calculateOpsMetrics(opsSnapshot), []);
  const spreadsheetPlan = useMemo(
    () => describeSpreadsheetIngestionPlan(pbppSpreadsheetMappingDraft),
    [],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.trim().toLowerCase() === "pbpp") {
      setUnlocked(true);
      setError("");
      return;
    }
    setError("Enter the internal operations password.");
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#050609] px-4 py-6 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/70">
              PBPP Internal
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Operations OS</h1>
            <p className="mt-4 text-sm leading-6 text-white/60">
              Hidden backend foundation for revenue, jobs, CRM, expenses, profit tracking, and
              future AI operations intelligence.
            </p>
            <label className="mt-8 block text-sm font-medium text-white/80">
              Access password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/60 focus:ring-4 focus:ring-sky-400/10"
                placeholder="Internal password"
              />
            </label>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black shadow-[0_18px_50px_rgba(255,255,255,0.12)] transition hover:bg-sky-100"
            >
              Open backend
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050609] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(125,211,252,0.2),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(250,204,21,0.1),transparent_28%),linear-gradient(180deg,#050609_0%,#090d14_55%,#050609_100%)]" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#050609]/88 px-4 py-4 backdrop-blur-2xl sm:-mx-6 sm:px-6 lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/70">
                PBPP Operations OS
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Luxury property operations backend
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
                The future path from walkthrough to quote, invoice, job, revenue, expenses, profit,
                analytics, and AI forecasting.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label="Active jobs" value={metrics.activeJobs.toString()} />
              <MiniStat label="Pipeline" value={formatCurrency(metrics.quotePipeline)} />
              <MiniStat label="Margin" value={formatPercent(metrics.grossMargin)} />
            </div>
          </div>
          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Operations modules">
            {modules.map((module) => (
              <a
                key={module}
                href={`#${slugify(module)}`}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/70 no-underline transition hover:border-sky-300/40 hover:text-white"
              >
                {module}
              </a>
            ))}
          </nav>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total revenue" value={formatCurrency(metrics.revenueTotal)} tone="sky" />
          <MetricCard label="Gross profit" value={formatCurrency(metrics.grossProfit)} tone="emerald" />
          <MetricCard label="Recurring revenue" value={formatCurrency(metrics.recurringRevenue)} tone="amber" />
          <MetricCard label="Avg job value" value={formatCurrency(metrics.averageJobValue)} tone="white" />
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            <Panel id="revenue-dashboard" eyebrow="Revenue Dashboard" title="Revenue intelligence">
              <div className="grid gap-3 sm:grid-cols-3">
                <KpiPill label="Paid" value={formatCurrency(metrics.paidRevenue)} />
                <KpiPill label="Pending" value={formatCurrency(metrics.pendingRevenue)} />
                <KpiPill label="Recurring" value={formatCurrency(metrics.recurringRevenue)} />
              </div>
              <div className="mt-5 space-y-3">
                {metrics.serviceMix.map((item) => (
                  <ProgressRow
                    key={item.label}
                    label={item.label}
                    value={formatCurrency(item.value)}
                    percent={metrics.revenueTotal > 0 ? item.value / metrics.revenueTotal : 0}
                  />
                ))}
              </div>
            </Panel>

            <Panel id="expense-tracking" eyebrow="Expense Tracking" title="Expense and labor control">
              <div className="grid gap-3 sm:grid-cols-3">
                <KpiPill label="Expenses" value={formatCurrency(metrics.expenseTotal)} />
                <KpiPill label="Labor cost" value={formatCurrency(metrics.laborCost)} />
                <KpiPill label="Labor utilization" value={formatPercent(metrics.laborUtilization)} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {opsSnapshot.expenses.map((expense) => (
                  <div key={expense.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{expense.vendor}</p>
                        <p className="mt-1 text-xs capitalize text-white/45">{expense.category}</p>
                      </div>
                      <p className="text-sm font-semibold text-white/75">{formatCurrency(expense.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel id="jobs-dashboard" eyebrow="Jobs Dashboard" title="Walkthrough to revenue pipeline">
              <div className="space-y-3">
                {opsSnapshot.jobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </div>
            </Panel>

            <Panel id="crm-layer" eyebrow="CRM Layer" title="Luxury client memory">
              <div className="grid gap-3 md:grid-cols-3">
                {opsSnapshot.contacts.map((contact) => (
                  <article key={contact.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold">{contact.name}</p>
                    <p className="mt-1 text-xs capitalize text-white/45">{contact.type.replace("-", " ")}</p>
                    <p className="mt-4 text-lg font-semibold">{formatCurrency(contact.lifetimeValue)}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {contact.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/[0.06] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/45"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <Panel id="profit-metrics" eyebrow="Profit Metrics" title="Margin view">
              <div className="rounded-[1.5rem] border border-emerald-200/20 bg-emerald-200/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
                  Gross margin
                </p>
                <p className="mt-2 text-4xl font-semibold">{formatPercent(metrics.grossMargin)}</p>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  Placeholder margin model. Future version connects labor burden, supplies, travel,
                  invoice status, and recurring contracts.
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <KpiPill label="Revenue" value={formatCurrency(metrics.revenueTotal)} />
                <KpiPill label="Expenses" value={formatCurrency(metrics.expenseTotal)} />
              </div>
            </Panel>

            <Panel id="operations-metrics" eyebrow="Operations Metrics" title="Operating system map">
              <ol className="space-y-2 text-sm text-white/62">
                {[
                  "Walkthrough",
                  "Quote",
                  "Invoice",
                  "Job",
                  "Revenue",
                  "Expenses",
                  "Profit Tracking",
                  "Analytics",
                ].map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <span>{step}</span>
                    <span className="text-xs text-white/35">{String(index + 1).padStart(2, "0")}</span>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel id="spreadsheet-ingestion" eyebrow="Spreadsheet Integration Prep" title="Import architecture">
              <ul className="space-y-2">
                {spreadsheetPlan.map((item) => (
                  <li key={item} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/58">
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel id="ai-ops" eyebrow="AI-ready hooks" title="Future intelligence">
              <div className="flex flex-wrap gap-2">
                {[
                  "Vision analysis",
                  "Room detection",
                  "Scuff detection",
                  "AI scopes",
                  "Invoice generation",
                  "Labor estimation",
                  "Upsell suggestions",
                  "Forecasting",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-sky-200/20 bg-sky-200/10 px-3 py-2 text-xs font-semibold text-sky-50"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Panel({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 rounded-[2rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/60">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-200/18"
      : tone === "amber"
        ? "from-amber-200/18"
        : tone === "sky"
          ? "from-sky-200/18"
          : "from-white/14";

  return (
    <div className={`rounded-[1.5rem] border border-white/10 bg-gradient-to-br ${toneClass} to-white/[0.04] p-5`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
      <p className="text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/35">
        {label}
      </p>
    </div>
  );
}

function KpiPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-white/50">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-200 to-white transition-all"
          style={{ width: `${Math.max(8, Math.round(percent * 100))}%` }}
        />
      </div>
    </div>
  );
}

function JobRow({ job }: { job: OpsJob }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{job.propertyName}</p>
          <p className="mt-1 text-xs text-white/45">
            {job.serviceLine} / {job.address} / {job.source}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold capitalize text-white/60">
            {job.status}
          </span>
          <span className="text-sm font-semibold">{formatCurrency(job.invoiceAmount || job.quotedAmount)}</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-white/50">
        <span className="rounded-2xl bg-white/[0.04] px-3 py-2">{job.estimatedLaborHours} est hrs</span>
        <span className="rounded-2xl bg-white/[0.04] px-3 py-2">{job.crewSize} crew</span>
        <span className="rounded-2xl bg-white/[0.04] px-3 py-2">{job.scheduledFor}</span>
      </div>
    </article>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
