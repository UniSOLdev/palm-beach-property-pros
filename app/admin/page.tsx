import Link from "next/link";
import { getDashboardStats } from "@/lib/admin/queries";
import { formatCurrency, formatPercent } from "@/lib/admin/format";
import { listTasks } from "@/lib/admin/actions/tasks";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, tasks] = await Promise.all([getDashboardStats(), listTasks()]);
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = tasks.filter(
    (t) => t.status !== "completed" && t.due_date && t.due_date <= today,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Operations</h1>
        <p className="text-sm text-charcoal/70">Palm Beach Property Pros — field command center</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Open tasks" value={String(stats.openTasks)} href="/admin/tasks" />
        <StatCard label="Urgent" value={String(stats.urgentTasks)} href="/admin/tasks" highlight />
        <StatCard label="Active jobs" value={String(stats.activeJobs)} href="/admin/jobs" />
        <StatCard label="Unpaid invoices" value={String(stats.unpaidInvoices)} href="/admin/invoices" />
        <StatCard label="Revenue (jobs)" value={formatCurrency(stats.pipeline)} href="/admin/jobs" />
        <StatCard label="Avg margin" value={formatPercent(stats.avgMargin)} href="/admin/jobs" />
      </div>

      <section className="admin-card">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-navy">Due today</h2>
          <Link href="/admin/tasks" className="text-sm font-semibold text-ocean no-underline">
            All tasks →
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {dueToday.length === 0 ? (
            <li className="text-sm text-charcoal/60">Nothing due today.</li>
          ) : (
            dueToday.slice(0, 5).map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-navy">{task.title}</span>
                <span className="admin-chip bg-amber-100 text-amber-900">{task.priority}</span>
              </li>
            ))
          )}
        </ul>
      </section>

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
