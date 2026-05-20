import Link from "next/link";
import { DashboardTasks } from "@/components/admin/dashboard-tasks";
import { getDashboardStats } from "@/lib/admin/queries";
import { formatCurrency, formatPercent } from "@/lib/admin/format";
import { listCrewOptions, listTasks, spawnRecurringTasks } from "@/lib/admin/actions/tasks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  try {
    await spawnRecurringTasks();
  } catch {
    /* non-blocking: dashboard still loads if recurring spawn fails */
  }
  const [stats, tasks, crew] = await Promise.all([
    getDashboardStats(),
    listTasks(),
    listCrewOptions(),
  ]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Operations</h1>
        <p className="text-sm text-charcoal/70">Palm Beach Property Pros — field command center</p>
      </div>

      <DashboardTasks tasks={tasks} crew={crew} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Active jobs" value={String(stats.activeJobs)} href="/admin/jobs" />
        <StatCard label="Unpaid invoices" value={String(stats.unpaidInvoices)} href="/admin/invoices" />
        <StatCard label="Revenue (jobs)" value={formatCurrency(stats.pipeline)} href="/admin/jobs" />
        <StatCard label="Avg margin" value={formatPercent(stats.avgMargin)} href="/admin/jobs" />
      </div>

      <section className="admin-card">
        <h2 className="text-lg font-bold text-navy">Month expenses</h2>
        <p className="mt-2 text-2xl font-bold text-charcoal">{formatCurrency(stats.expenseTotal)}</p>
        <Link href="/admin/expenses" className="mt-3 inline-block text-sm font-semibold text-ocean no-underline">
          Manage expenses →
        </Link>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`admin-card block min-h-[88px] no-underline transition hover:shadow-lift ${
        highlight ? "ring-2 ring-ocean/30" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">{label}</p>
      <p className="mt-2 text-xl font-bold text-navy">{value}</p>
    </Link>
  );
}
