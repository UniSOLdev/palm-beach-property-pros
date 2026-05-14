import Link from "next/link";
import {
  AdminPageHeader,
  Card,
  ExpenseCategoryBadge,
  MiniProgressBar,
  ProfitToneBadge,
  StatCard,
  StatusBadge,
} from "@/components/admin/ui";
import { EXPENSE_CATEGORIES } from "@/lib/admin/constants";
import {
  businessInvestmentVsJobCost,
  categorySpendRows,
  isInCalendarMonth,
  largestVendor,
  paymentMethodExpenseTotals,
} from "@/lib/admin/expense-analytics";
import { formatCurrency } from "@/lib/admin/format";
import { invoiceBalanceDue } from "@/lib/admin/invoice-totals";
import { computeJobProfitRows, grossOperatingMarginPct, paidRevenueByPaymentMethodThisMonth } from "@/lib/admin/job-profit";
import { bestClientsFrom, computeDashboardMetricsFrom, revenueByServiceType } from "@/lib/admin/metrics";
import { quoteLineTotal } from "@/lib/admin/quote-totals";
import {
  listClients,
  listCrewMembers,
  listCrewPayouts,
  listExpenses,
  listInvoices,
  listJobs,
  listQuotes,
  listSupplies,
} from "@/lib/admin/queries";

function marginLabel(tone: "strong" | "thin" | "loss", pct: number) {
  if (tone === "strong") return `Healthy · ${pct.toFixed(0)}%`;
  if (tone === "thin") return `Thin · ${pct.toFixed(0)}%`;
  return `Loss · ${pct.toFixed(0)}%`;
}

export default async function ReportsPage() {
  const now = new Date();
  const [clients, jobs, quotes, invoices, expenses, payouts, crewMembers, supplies] = await Promise.all([
    listClients(),
    listJobs(),
    listQuotes(),
    listInvoices(),
    listExpenses(),
    listCrewPayouts(),
    listCrewMembers(),
    listSupplies(),
  ]);

  const m = computeDashboardMetricsFrom({ jobs, invoices, expenses, quotes }, now);
  const byService = revenueByServiceType(jobs);
  const best = bestClientsFrom(clients, jobs);
  const outstanding = invoices.filter((i) => ["Unpaid", "Partially Paid", "Overdue"].includes(i.paymentStatus));
  const openQuotesList = quotes.filter((q) => ["Draft", "Sent", "Approved"].includes(q.status));
  const quoteDraft = quotes.filter((q) => q.status === "Draft").length;
  const quoteSent = quotes.filter((q) => q.status === "Sent").length;
  const quoteApproved = quotes.filter((q) => q.status === "Approved").length;
  const sources = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.referralSource] = (acc[j.referralSource] ?? 0) + 1;
    return acc;
  }, {});
  const sourceRows = Object.entries(sources).sort((a, b) => b[1] - a[1]);

  const monthExpenses = expenses.filter((e) => isInCalendarMonth(e.date, now));
  const expenseCats = categorySpendRows(monthExpenses, EXPENSE_CATEGORIES);
  const invest = businessInvestmentVsJobCost(expenses, (e) => isInCalendarMonth(e.date, now));
  const expensePay = paymentMethodExpenseTotals(monthExpenses);
  const revPay = paidRevenueByPaymentMethodThisMonth(invoices, now);
  const grossMargin = grossOperatingMarginPct(m.revenueThisMonth, m.jobSpecificExpensesMonth);

  const profitRows = computeJobProfitRows(jobs, expenses, payouts, clients);
  const closedForAvg = profitRows.filter((r) => ["Completed", "Paid"].includes(r.status));
  const avgJobProfit =
    closedForAvg.length === 0 ? 0 : closedForAvg.reduce((a, r) => a + r.estimatedProfit, 0) / closedForAvg.length;

  const supplyInventoryValue = supplies.reduce((a, s) => a + Math.max(0, s.quantity) * Math.max(0, s.cost), 0);
  const supplyHeavySpend = monthExpenses
    .filter((e) => e.category === "Supplies" || e.category === "Chemicals" || e.category === "Equipment")
    .reduce((a, e) => a + e.amount, 0);

  const clientById = new Map(clients.map((c) => [c.id, c] as const));
  const jobById = new Map(jobs.map((j) => [j.id, j] as const));
  const memberById = new Map(crewMembers.map((cm) => [cm.id, cm] as const));

  const crewAllocated = new Map<string, { name: string; total: number; jobs: number }>();
  for (const p of payouts) {
    const share = p.calculatedTotal / Math.max(1, p.crewMemberIds.length);
    for (const mid of p.crewMemberIds) {
      const cur = crewAllocated.get(mid) ?? { name: memberById.get(mid)?.name ?? mid, total: 0, jobs: 0 };
      cur.total += share;
      cur.jobs += 1;
      crewAllocated.set(mid, cur);
    }
  }
  const crewRows = [...crewAllocated.entries()]
    .map(([id, row]) => ({ id, ...row }))
    .sort((a, b) => b.total - a.total);

  const topVendorMonth = largestVendor(monthExpenses);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Reports"
        subtitle="Owner command center — revenue, spend, job-level profit, and cash vs digital in one scan."
      />

      <section className="rounded-3xl border border-navy/10 bg-gradient-to-br from-sky/25 via-white to-emerald-50/30 p-4 shadow-card sm:p-6">
        <h2 className="text-xs font-bold uppercase tracking-wide text-navy/75">1 · Monthly performance</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Revenue (paid · MTD)" value={formatCurrency(m.revenueThisMonth)} />
          <StatCard label="Expenses (all · MTD)" value={formatCurrency(m.expensesThisMonth)} />
          <StatCard label="Estimated net profit" value={formatCurrency(m.estimatedProfit)} hint="Paid revenue minus all MTD expenses" />
          <StatCard
            label="Gross margin (ops)"
            value={`${grossMargin.toFixed(1)}%`}
            hint="Paid revenue vs job-specific MTD expenses"
          />
          <StatCard label="Cash (MTD paid)" value={formatCurrency(m.cashCollectedMtd)} />
          <StatCard label="Zelle collected (MTD)" value={formatCurrency(revPay.Zelle)} />
          <StatCard label="Card collected (MTD)" value={formatCurrency(revPay.Card)} />
          <StatCard label="Check collected (MTD)" value={formatCurrency(revPay.Check)} />
          <StatCard label="Outstanding invoices" value={formatCurrency(m.outstandingBalance)} hint={`${m.unpaidInvoices} open statuses`} />
          <StatCard
            label="Open quotes (pipeline)"
            value={String(m.openQuotes)}
            hint={`Approved also open: ${quoteApproved} · Draft ${quoteDraft} · Sent ${quoteSent}`}
          />
          <StatCard label="Average job value (paid jobs)" value={formatCurrency(m.averageJobValue)} />
          <StatCard label="Average job profit (est.)" value={formatCurrency(avgJobProfit)} hint="Completed / Paid jobs only" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="2 · Revenue by service type (job revenue)">
          <div className="space-y-3">
            {byService.length ? (
              byService.map(([service, amt]) => (
                <div key={service}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-navy">{service}</span>
                    <span className="text-charcoal/70">{formatCurrency(amt)}</span>
                  </div>
                  <MiniProgressBar fraction={byService[0][1] > 0 ? amt / byService[0][1] : 0} />
                </div>
              ))
            ) : (
              <div className="text-sm text-charcoal/60">No job revenue recorded yet.</div>
            )}
          </div>
        </Card>

        <Card title="3 · Expense categories (MTD)">
          {expenseCats.some((r) => r.total > 0) ? (
            <div className="space-y-3">
              {expenseCats
                .filter((r) => r.total > 0)
                .slice(0, 10)
                .map((r) => (
                  <div key={r.category}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <ExpenseCategoryBadge category={r.category} />
                      <span className="text-charcoal/75">
                        {formatCurrency(r.total)}{" "}
                        <span className="text-xs text-charcoal/50">({r.percentOfTotal.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <MiniProgressBar fraction={r.percentOfTotal / 100} />
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-charcoal/60">No expenses this month.</p>
          )}
        </Card>
      </div>

      <Card title="4 · Job profit breakdown">
        <p className="mb-4 text-sm text-charcoal/70">
          Estimated profit = job revenue − <span className="font-semibold text-navy">job-specific expenses</span> −{" "}
          <span className="font-semibold text-navy">crew payouts</span>. Reusable supplies and equipment are excluded
          unless you tag them as job-specific.
        </p>
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/55">
                <th className="py-2 pr-3">Client</th>
                <th className="py-2 pr-3">Service</th>
                <th className="py-2 pr-3 text-right">Revenue</th>
                <th className="py-2 pr-3 text-right">Job exp.</th>
                <th className="py-2 pr-3 text-right">Crew</th>
                <th className="py-2 pr-3 text-right">Est. profit</th>
                <th className="py-2 pr-3">Margin</th>
                <th className="py-2 pr-3">Pay</th>
                <th className="py-2 pr-0">Status</th>
              </tr>
            </thead>
            <tbody>
              {profitRows.map((r) => (
                <tr key={r.jobId} className="border-b border-navy/5 last:border-0">
                  <td className="py-3 pr-3 font-semibold text-navy">
                    <Link href={`/admin/jobs/${r.jobId}`} className="text-ocean no-underline">
                      {r.clientName}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-charcoal/80">{r.serviceType}</td>
                  <td className="py-3 pr-3 text-right">{formatCurrency(r.revenue)}</td>
                  <td className="py-3 pr-3 text-right text-charcoal/75">{formatCurrency(r.jobSpecificExpenses)}</td>
                  <td className="py-3 pr-3 text-right text-charcoal/75">{formatCurrency(r.crewPayouts)}</td>
                  <td className={`py-3 pr-3 text-right font-semibold ${r.estimatedProfit >= 0 ? "text-leaf" : "text-rose-700"}`}>
                    {formatCurrency(r.estimatedProfit)}
                  </td>
                  <td className="py-3 pr-3">
                    <ProfitToneBadge tone={r.tone}>{marginLabel(r.tone, r.marginPct)}</ProfitToneBadge>
                  </td>
                  <td className="py-3 pr-3 text-xs text-charcoal/70">{r.paymentMethod ?? "—"}</td>
                  <td className="py-3 pr-0">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 lg:hidden">
          {profitRows.map((r) => (
            <div key={r.jobId} className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/admin/jobs/${r.jobId}`} className="font-semibold text-ocean no-underline">
                    {r.clientName}
                  </Link>
                  <div className="text-xs text-charcoal/60">{r.serviceType}</div>
                </div>
                <ProfitToneBadge tone={r.tone}>{marginLabel(r.tone, r.marginPct)}</ProfitToneBadge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-charcoal/55">Revenue</div>
                  <div className="font-semibold text-navy">{formatCurrency(r.revenue)}</div>
                </div>
                <div>
                  <div className="text-xs text-charcoal/55">Est. profit</div>
                  <div className={`font-semibold ${r.estimatedProfit >= 0 ? "text-leaf" : "text-rose-700"}`}>
                    {formatCurrency(r.estimatedProfit)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-charcoal/55">Job exp.</div>
                  <div>{formatCurrency(r.jobSpecificExpenses)}</div>
                </div>
                <div>
                  <div className="text-xs text-charcoal/55">Crew</div>
                  <div>{formatCurrency(r.crewPayouts)}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={r.status} />
                <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-charcoal/70 ring-1 ring-navy/10">
                  {r.paymentMethod ?? "Pay —"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="5 · Payment breakdown (MTD)">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-navy/70">Revenue (paid invoices)</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {(["Cash", "Zelle", "Card", "Check", "Square Invoice", "Other"] as const).map((k) => (
                  <li key={k} className="flex justify-between gap-2">
                    <span className="text-charcoal">{k}</span>
                    <span className="font-semibold text-leaf">{formatCurrency(revPay[k] ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-navy/70">Expenses (outflows)</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {(["Cash", "Zelle", "Card", "Check", "Square Invoice", "Other"] as const).map((k) => (
                  <li key={`e-${k}`} className="flex justify-between gap-2">
                    <span className="text-charcoal">{k}</span>
                    <span className="font-semibold text-navy">{formatCurrency(expensePay[k])}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card title="Business investment vs job cost (MTD)">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Job-specific" value={formatCurrency(invest.jobSpecific)} />
            <StatCard label="Reusable supplies" value={formatCurrency(invest.reusableSupplies)} />
            <StatCard label="Equipment" value={formatCurrency(invest.equipment)} />
            <StatCard label="Overhead" value={formatCurrency(invest.overhead)} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-charcoal/70">
            Reusable supplies and equipment are tracked separately so one supply run does not distort individual job
            profit.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="6 · Best clients (job revenue)">
          <ol className="space-y-3">
            {best.slice(0, 5).map((row, idx) => (
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

        <Card title="7 · Outstanding invoices">
          <ul className="space-y-2 text-sm">
            {outstanding.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <Link href={`/admin/invoices/${i.id}`} className="font-semibold text-ocean no-underline">
                  {i.invoiceNumber}
                </Link>
                <span>{formatCurrency(invoiceBalanceDue(i))}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="8 · Open quotes (draft · sent · approved)">
          <p className="mb-3 text-xs text-charcoal/60">
            Draft {quoteDraft} · Sent {quoteSent} · Approved {quoteApproved} (approved still convertible to invoice).
          </p>
          <ul className="space-y-2 text-sm">
            {openQuotesList.map((q) => (
              <li key={q.id} className="flex justify-between gap-3">
                <Link href={`/admin/quotes/${q.id}`} className="font-semibold text-ocean no-underline">
                  {q.quoteNumber}
                </Link>
                <span>{formatCurrency(quoteLineTotal(q))}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="9 · Crew payout summary">
          <ul className="space-y-3 text-sm">
            {payouts.map((p) => {
              const job = jobById.get(p.jobId);
              const client = job ? clientById.get(job.clientId) : undefined;
              const names = p.crewMemberIds.map((id) => memberById.get(id)?.name ?? id).join(", ");
              return (
                <li key={p.id} className="rounded-xl border border-navy/8 bg-sand/15 p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <div className="font-semibold text-navy">
                        {client?.name ?? "Client"} · {job?.serviceType ?? "Job"}
                      </div>
                      <div className="text-xs text-charcoal/55">{names}</div>
                    </div>
                    <div className="font-bold text-navy">{formatCurrency(p.calculatedTotal)}</div>
                  </div>
                  {job ? (
                    <Link href={`/admin/jobs/${job.id}`} className="mt-2 inline-block text-xs font-semibold text-ocean no-underline">
                      Open job
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {payouts.length === 0 ? <p className="text-sm text-charcoal/60">No payouts logged yet.</p> : null}
        </Card>

        <Card title="9b · Crew by member (allocated share)">
          <p className="mb-3 text-xs text-charcoal/60">
            Each payout is split evenly across assigned crew for a quick directional total (not payroll accounting).
          </p>
          <ul className="space-y-2 text-sm">
            {crewRows.map((row) => (
              <li key={row.id} className="flex justify-between gap-3">
                <span className="font-semibold text-navy">{row.name}</span>
                <span>
                  {formatCurrency(row.total)}{" "}
                  <span className="text-xs text-charcoal/50">({row.jobs} payouts)</span>
                </span>
              </li>
            ))}
          </ul>
          {crewRows.length === 0 ? <p className="text-sm text-charcoal/60">No payout rows to allocate.</p> : null}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="10 · Supplies & equipment spending">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="MTD · supplies / chemicals / equipment"
              value={formatCurrency(supplyHeavySpend)}
              hint="From expense categories this month"
            />
            <StatCard
              label="Inventory on hand (qty × cost)"
              value={formatCurrency(supplyInventoryValue)}
              hint="From supplies module"
            />
          </div>
          {topVendorMonth ? (
            <p className="mt-4 text-sm text-charcoal/70">
              Top vendor (MTD): <span className="font-semibold text-navy">{topVendorMonth.vendor}</span> ·{" "}
              {formatCurrency(topVendorMonth.total)}
            </p>
          ) : null}
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
      </div>
    </div>
  );
}
