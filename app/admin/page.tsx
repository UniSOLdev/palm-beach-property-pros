export const dynamic = "force-dynamic";

import Link from "next/link";
import { TasksDashboardWidget } from "@/components/admin/tasks-dashboard-widget";
import { loadOpsDashboardMetrics } from "@/lib/ops/analytics";

export const metadata = {
  title: "Operations",
};

function fmtMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function AdminDashboardPage() {
  let clients = 0;
  let invoices = 0;
  let jobs = 0;
  let expense_count = 0;
  let expense_total_cents = 0;
  let profit_signal_cents = 0;
  let active_jobs = 0;
  let crew_active = 0;
  let low_stock = 0;
  let err: string | null = null;

  try {
    const metrics = await loadOpsDashboardMetrics();
    clients = metrics.clients;
    invoices = metrics.invoices;
    jobs = metrics.jobs;
    active_jobs = metrics.active_jobs;
    expense_count = metrics.expense_count;
    expense_total_cents = metrics.expense_cents;
    profit_signal_cents = metrics.profit_signal_cents;
    crew_active = metrics.crew_active;
    low_stock = metrics.low_stock;
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not reach Supabase.";
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">PBPP Operations — field snapshot</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/jobs"
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-100 no-underline transition hover:bg-white/5"
          >
            Open jobs
          </Link>
          <Link
            href="/admin/expenses/import"
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-100 no-underline transition hover:bg-white/5"
          >
            Import expenses
          </Link>
          <Link
            href="/admin/crew"
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-100 no-underline transition hover:bg-white/5"
          >
            Crew ops
          </Link>
          <Link
            href="/admin/supplies"
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-100 no-underline transition hover:bg-white/5"
          >
            Ops inventory
          </Link>
          <Link
            href="/admin/invoices/new"
            className="rounded-xl bg-sky-500/90 px-5 py-2.5 text-sm font-semibold text-sky-950 no-underline shadow-lg shadow-sky-900/25 transition hover:bg-sky-400"
          >
            New invoice
          </Link>
        </div>
      </div>

      {err ? (
        <p className="mt-6 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {err}
        </p>
      ) : null}

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 ring-1 ring-emerald-400/15 sm:col-span-2 lg:col-span-3 xl:col-span-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80">Profit signal</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{fmtMoney(profit_signal_cents)}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Invoice revenue minus recorded expenses · {active_jobs} active jobs · {crew_active} crew ·{" "}
            {low_stock} low-stock SKUs
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06]">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">CRM clients</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{clients}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06]">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Jobs</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{jobs}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06]">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Invoices</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{invoices}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06]">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Expenses</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{expense_count}</p>
          <p className="mt-1 text-xs text-zinc-500">{fmtMoney(expense_total_cents)} recorded</p>
        </div>
      </div>

      <TasksDashboardWidget />

      <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Workflows</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          <li>
            <Link href="/admin/tasks" className="text-sky-300 no-underline hover:underline">
              Tasks / action list →
            </Link>{" "}
            <span className="text-zinc-600">— daily follow-ups, crew, admin, and invoice reminders.</span>
          </li>
          <li>
            <Link href="/admin/jobs" className="text-sky-300 no-underline hover:underline">
              Jobs board →
            </Link>{" "}
            <span className="text-zinc-600">— editable field records with quote & invoice links.</span>
          </li>
          <li>
            <Link href="/admin/expenses" className="text-sky-300 no-underline hover:underline">
              Expense intelligence →
            </Link>{" "}
            <span className="text-zinc-600">— sheet imports, category & payment analytics, job costing.</span>
          </li>
          <li>
            <Link href="/admin/supplies" className="text-sky-300 no-underline hover:underline">
              Ops inventory (depot) →
            </Link>{" "}
            <span className="text-zinc-600">— storage locations, crew loadouts, consumables & equipment.</span>
          </li>
          <li>
            <Link href="/admin/crew" className="text-sky-300 no-underline hover:underline">
              Crew operations →
            </Link>{" "}
            <span className="text-zinc-600">— roster, dispatch board, payout calculator, labor profitability.</span>
          </li>
          <li>
            <Link href="/admin/website" className="text-sky-300 no-underline hover:underline">
              Website manager →
            </Link>{" "}
            <span className="text-zinc-600">— homepage, SEO, media, navigation, and service overlays.</span>
          </li>
          <li>
            <Link href="/admin/clients" className="text-sky-300 no-underline hover:underline">
              Clients →
            </Link>{" "}
            <span className="text-zinc-600">— edit CRM records, notes, and contact details.</span>
          </li>
          <li>
            <Link href="/admin/invoices" className="text-sky-300 no-underline hover:underline">
              Invoices →
            </Link>{" "}
            <span className="text-zinc-600">— update line items, status, and public links.</span>
          </li>
          <li>
            <Link href="/admin/invoices/new" className="text-sky-300 no-underline hover:underline">
              Create invoice →
            </Link>{" "}
            <span className="text-zinc-600">— attach client for history and public share link.</span>
          </li>
          <li className="text-zinc-600">
            Quote handoff: use{" "}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-300">
              /admin/invoices/new?client_id=…&amp;from_quote=1
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
}
