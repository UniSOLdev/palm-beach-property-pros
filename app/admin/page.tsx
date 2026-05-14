import Link from "next/link";
import { AdminPageHeader, Card, StatCard } from "@/components/admin/ui";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { computeDashboardMetrics } from "@/lib/admin/metrics";
import { adminSeed, getClientById } from "@/lib/admin/seed";
import { invoiceBalanceDue } from "@/lib/admin/invoice-totals";

export default function AdminDashboardPage() {
  const metrics = computeDashboardMetrics();
  const { jobs, quotes, invoices, expenses } = adminSeed;

  const upcomingJobs = [...jobs]
    .filter((j) => ["Scheduled", "Approved", "In Progress"].includes(j.status))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const recentQuotes = [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const recentInvoices = [...invoices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Central command center for jobs, money, crew, and quality — optimized for Palm Beach County field work."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <StatCard label="Revenue (this month)" value={formatCurrency(metrics.revenueThisMonth)} />
        <StatCard label="Expenses (this month)" value={formatCurrency(metrics.expensesThisMonth)} />
        <StatCard
          label="Estimated profit"
          value={formatCurrency(metrics.estimatedProfit)}
          hint="Paid invoices this month minus expenses logged this month"
        />
        <StatCard label="Open quotes" value={String(metrics.openQuotes)} />
        <StatCard label="Unpaid invoices" value={String(metrics.unpaidInvoices)} />
        <StatCard label="Jobs scheduled (this month)" value={String(metrics.jobsScheduled)} />
        <StatCard label="Completed jobs (this month)" value={String(metrics.completedJobs)} />
        <StatCard label="Average job value (paid)" value={formatCurrency(metrics.averageJobValue)} />
        <StatCard label="Cash collected (all time)" value={formatCurrency(metrics.cashCollected)} />
        <StatCard label="Card / Zelle collected (all time)" value={formatCurrency(metrics.cardZelleCollected)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Upcoming jobs">
          <ul className="divide-y divide-navy/10">
            {upcomingJobs.map((j) => {
              const client = getClientById(j.clientId);
              return (
                <li key={j.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-navy">{client?.name ?? "Client"}</div>
                    <div className="text-sm text-charcoal/70">
                      {j.serviceType} · {formatDate(j.date)} {j.startTime}
                    </div>
                    <div className="text-xs text-charcoal/55">{j.address}</div>
                  </div>
                  <Link href={`/admin/jobs/${j.id}`} className="text-sm font-semibold text-ocean no-underline">
                    Open →
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link className="btn-primary text-center no-underline" href="/admin/jobs/new">
              Create job
            </Link>
            <Link className="btn-secondary text-center no-underline" href="/admin/quotes/new">
              Create quote
            </Link>
            <Link className="btn-secondary text-center no-underline" href="/admin/invoices/new">
              Create invoice
            </Link>
            <Link className="btn-secondary text-center no-underline" href="/admin/expenses/new">
              Add expense
            </Link>
            <Link className="btn-secondary text-center no-underline" href="/admin/clients/new">
              Add client
            </Link>
            <Link className="btn-secondary text-center no-underline" href="/admin/sops">
              Open SOP checklist
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Recent quotes">
          <ul className="space-y-3">
            {recentQuotes.map((q) => {
              const c = getClientById(q.clientId);
              return (
                <li key={q.id} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-navy">{q.quoteNumber}</div>
                    <div className="text-sm text-charcoal/70">{c?.name}</div>
                    <div className="text-xs text-charcoal/50">{q.status}</div>
                  </div>
                  <Link href={`/admin/quotes/${q.id}`} className="shrink-0 text-sm font-semibold text-ocean no-underline">
                    View
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Recent invoices">
          <ul className="space-y-3">
            {recentInvoices.map((inv) => {
              const c = getClientById(inv.clientId);
              return (
                <li key={inv.id} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-navy">{inv.invoiceNumber}</div>
                    <div className="text-sm text-charcoal/70">{c?.name}</div>
                    <div className="text-xs text-charcoal/50">
                      {inv.paymentStatus} · Balance {formatCurrency(invoiceBalanceDue(inv))}
                    </div>
                  </div>
                  <Link href={`/admin/invoices/${inv.id}`} className="shrink-0 text-sm font-semibold text-ocean no-underline">
                    View
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Recent expenses">
          <ul className="space-y-3">
            {recentExpenses.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-navy">{e.vendor}</div>
                  <div className="text-sm text-charcoal/70">{e.description}</div>
                  <div className="text-xs text-charcoal/50">
                    {e.category} · {e.expenseType}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold text-navy">{formatCurrency(e.amount)}</div>
                  <div className="text-xs text-charcoal/50">{formatDate(e.date)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
