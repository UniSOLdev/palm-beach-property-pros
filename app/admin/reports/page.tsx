import { AdminPageHeader, Card } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/admin/format";
import { bestClients, computeDashboardMetrics, revenueByServiceType } from "@/lib/admin/metrics";
import { invoiceBalanceDue } from "@/lib/admin/invoice-totals";
import { quoteLineTotal } from "@/lib/admin/quote-totals";
import { adminSeed } from "@/lib/admin/seed";

export default function ReportsPage() {
  const m = computeDashboardMetrics();
  const byService = revenueByServiceType(adminSeed.jobs);
  const clients = bestClients();
  const outstanding = adminSeed.invoices.filter((i) => ["Unpaid", "Partially Paid", "Overdue"].includes(i.paymentStatus));
  const openQuotes = adminSeed.quotes.filter((q) => ["Draft", "Sent"].includes(q.status));
  const sources = adminSeed.jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.referralSource] = (acc[j.referralSource] ?? 0) + 1;
    return acc;
  }, {});
  const sourceRows = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  const supplySpend = adminSeed.expenses
    .filter((e) => e.category === "Supplies" || e.category === "Chemicals")
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <div>
      <AdminPageHeader
        title="Reports"
        subtitle="Executive snapshots without the bloat — tuned for owner-operators."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Revenue (MTD)">
          <div className="text-3xl font-bold text-navy">{formatCurrency(m.revenueThisMonth)}</div>
        </Card>
        <Card title="Expenses (MTD)">
          <div className="text-3xl font-bold text-navy">{formatCurrency(m.expensesThisMonth)}</div>
        </Card>
        <Card title="Profit estimate">
          <div className="text-3xl font-bold text-leaf">{formatCurrency(m.estimatedProfit)}</div>
        </Card>
        <Card title="Outstanding AR">
          <div className="text-3xl font-bold text-navy">{formatCurrency(m.outstandingBalance)}</div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Revenue by service type (job revenue)">
          <div className="space-y-3">
            {byService.length ? (
              byService.map(([service, amt]) => (
                <div key={service}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-navy">{service}</span>
                    <span className="text-charcoal/70">{formatCurrency(amt)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-sky/60">
                    <div
                      className="h-full rounded-full bg-ocean"
                      style={{ width: `${Math.min(100, (amt / byService[0][1]) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-charcoal/60">No paid revenue recorded yet.</div>
            )}
          </div>
        </Card>

        <Card title="Best clients (job revenue)">
          <ol className="space-y-3">
            {clients.slice(0, 5).map((row, idx) => (
              <li key={row.client.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-navy">{row.client.name}</div>
                    <div className="text-xs text-charcoal/55">{row.jobsDone} completed jobs</div>
                  </div>
                </div>
                <div className="font-semibold text-leaf">{formatCurrency(row.revenue)}</div>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Outstanding invoices">
          <ul className="space-y-2 text-sm">
            {outstanding.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="font-semibold text-navy">{i.invoiceNumber}</span>
                <span>{formatCurrency(invoiceBalanceDue(i))}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Open quotes">
          <ul className="space-y-2 text-sm">
            {openQuotes.map((q) => (
              <li key={q.id} className="flex justify-between gap-3">
                <span className="font-semibold text-navy">{q.quoteNumber}</span>
                <span>{formatCurrency(quoteLineTotal(q))}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Job source performance">
          <ul className="space-y-2 text-sm">
            {sourceRows.map(([src, count]) => (
              <li key={src} className="flex justify-between gap-3">
                <span className="text-charcoal">{src}</span>
                <span className="font-semibold text-navy">{count} jobs</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Crew payouts (logged)">
          <ul className="space-y-2 text-sm">
            {adminSeed.crewPayouts.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span className="text-charcoal">{p.jobId}</span>
                <span className="font-semibold text-navy">{formatCurrency(p.calculatedTotal)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Supplies spending (chemicals + supplies)">
          <div className="text-3xl font-bold text-navy">{formatCurrency(supplySpend)}</div>
          <p className="mt-2 text-sm text-charcoal/60">Roll-up of mock expenses tagged to supply-heavy categories.</p>
        </Card>
      </div>
    </div>
  );
}
