import Link from "next/link";
import {
  AdminPageHeader,
  Card,
  ExpenseCategoryBadge,
  ExpenseTypeBadge,
  MiniProgressBar,
  StatCard,
} from "@/components/admin/ui";
import { EXPENSE_CATEGORIES, EXPENSE_TYPES } from "@/lib/admin/constants";
import {
  businessInvestmentVsJobCost,
  categorySpendRows,
  computeExpenseMonthKpis,
  isInCalendarMonth,
  largestVendor,
  mostCommonCategory,
  paymentMethodExpenseTotals,
} from "@/lib/admin/expense-analytics";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import type { ExpenseListFilters } from "@/lib/admin/queries";
import { listClients, listExpenses, listJobs } from "@/lib/admin/queries";
import type { Expense } from "@/lib/admin/types";

const PAYMENT_FILTER_OPTIONS = ["Cash", "Zelle", "Card", "Check", "Square Invoice", "Other"] as const;

function resolveServiceLabel(e: Expense, jobService: string | undefined) {
  return e.serviceType?.trim() || jobService || "—";
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<
    ExpenseListFilters & {
      saved?: string;
      archived?: string;
      err?: string;
    }
  >;
}) {
  const sp = await searchParams;
  const filters: ExpenseListFilters = {
    category: sp.category || undefined,
    expenseType: sp.expenseType || undefined,
    paymentMethod: sp.paymentMethod || undefined,
    jobId: sp.jobId || undefined,
    month: sp.month || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    search: sp.search || undefined,
    sort: sp.sort === "amount" ? "amount" : "date",
    order: sp.order === "asc" ? "asc" : "desc",
  };

  const now = new Date();

  const [allExpenses, rows, jobs, clients] = await Promise.all([
    listExpenses(),
    listExpenses(filters),
    listJobs(),
    listClients(),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c] as const));
  const jobById = new Map(jobs.map((j) => [j.id, j] as const));

  const kpis = computeExpenseMonthKpis(allExpenses, jobs, now);
  const monthSlice = allExpenses.filter((e) => isInCalendarMonth(e.date, now));
  const whereWent = categorySpendRows(monthSlice, EXPENSE_CATEGORIES);
  const topCat = whereWent[0];
  const invest = businessInvestmentVsJobCost(allExpenses, (e) => isInCalendarMonth(e.date, now));
  const expensePay = paymentMethodExpenseTotals(monthSlice);
  const lv = largestVendor(monthSlice);
  const mcc = mostCommonCategory(monthSlice);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Expenses"
        subtitle="Expense intelligence: job costs stay honest while supplies and equipment show as business investment, not phantom job losses."
        actions={
          <Link href="/admin/expenses/new" className="btn-primary no-underline">
            Add expense
          </Link>
        }
      />

      {(sp.err || sp.saved || sp.archived) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            sp.err ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {sp.err ? sp.err : sp.archived ? "Expense archived." : "Expense saved."}
        </div>
      )}

      <section className="rounded-3xl border border-navy/10 bg-gradient-to-br from-sky/30 via-white to-amber-50/40 p-4 shadow-card sm:p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-navy/75">This month · at a glance</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Total expenses" value={formatCurrency(kpis.totalExpenses)} />
          <StatCard label="Job-specific" value={formatCurrency(kpis.jobSpecific)} hint="Counts toward per-job profit" />
          <StatCard label="Reusable supplies" value={formatCurrency(kpis.reusableSupplies)} />
          <StatCard label="Equipment investment" value={formatCurrency(kpis.equipment)} />
          <StatCard label="Overhead" value={formatCurrency(kpis.overhead)} />
          <StatCard label="Reimbursable (tagged)" value={formatCurrency(kpis.reimbursableAmount)} />
          <StatCard label="Unreimbursed" value={formatCurrency(kpis.unreimbursedAmount)} hint="Reimbursable & not yet reimbursed" />
          <StatCard
            label="Avg job-specific / job"
            value={kpis.jobsWithJobSpecificSpend ? formatCurrency(kpis.averageExpensePerJobWithSpend) : "—"}
            hint={kpis.jobsWithJobSpecificSpend ? `${kpis.jobsWithJobSpecificSpend} jobs with tagged spend` : "No job-tagged rows"}
          />
          <StatCard
            label="Largest category (MTD)"
            value={kpis.largestCategory ? kpis.largestCategory : "—"}
            hint={kpis.largestCategory ? formatCurrency(kpis.largestCategoryAmount) : undefined}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Where money went (this month)">
          {topCat && topCat.total > 0 ? (
            <div className="space-y-3">
              {whereWent
                .filter((r) => r.total > 0)
                .slice(0, 8)
                .map((r) => (
                  <div key={r.category}>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-navy">{r.category}</span>
                      <span className="text-charcoal/75">
                        {formatCurrency(r.total)}{" "}
                        <span className="text-xs text-charcoal/50">({r.percentOfTotal.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <MiniProgressBar fraction={r.percentOfTotal / 100} />
                  </div>
                ))}
              <div className="mt-4 border-t border-navy/10 pt-3 text-xs text-charcoal/65">
                {lv ? (
                  <span>
                    Largest vendor: <span className="font-semibold text-navy">{lv.vendor}</span> ·{" "}
                    {formatCurrency(lv.total)}
                  </span>
                ) : null}
                {mcc ? (
                  <span className={lv ? " ml-3 block sm:inline sm:ml-3" : ""}>
                    Most frequent category: <span className="font-semibold text-navy">{mcc}</span>
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-charcoal/60">No expenses recorded this month yet.</p>
          )}
        </Card>

        <Card title="Business investment vs job cost (this month)">
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

        <Card title="Payment breakdown · expenses (this month)">
          <ul className="space-y-2 text-sm">
            {(["Cash", "Zelle", "Card", "Check", "Square Invoice", "Other"] as const).map((m) => (
              <li key={m} className="flex justify-between gap-3">
                <span className="text-charcoal">{m}</span>
                <span className="font-semibold text-navy">{formatCurrency(expensePay[m])}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Filters & search">
        <form className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6" method="get">
          <label className="lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Search</span>
            <input
              name="search"
              defaultValue={sp.search ?? ""}
              placeholder="Vendor, item, notes…"
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Month</span>
            <input
              type="month"
              name="month"
              defaultValue={sp.month ?? ""}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
            />
            <span className="mt-0.5 block text-[11px] text-charcoal/50">Leave blank for all dates (use From/To to narrow).</span>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Category</span>
            <select name="category" defaultValue={sp.category ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2">
              <option value="">All</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Expense type</span>
            <select name="expenseType" defaultValue={sp.expenseType ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2">
              <option value="">All</option>
              {EXPENSE_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment</span>
            <select name="paymentMethod" defaultValue={sp.paymentMethod ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2">
              <option value="">All</option>
              {PAYMENT_FILTER_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Related job</span>
            <select name="jobId" defaultValue={sp.jobId ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2">
              <option value="">All jobs</option>
              {jobs.map((j) => {
                const cn = clientById.get(j.clientId)?.name ?? "Client";
                return (
                  <option key={j.id} value={j.id}>
                    {cn} · {j.serviceType} · {j.date}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">From</span>
            <input type="date" name="from" defaultValue={sp.from ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">To</span>
            <input type="date" name="to" defaultValue={sp.to ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Sort</span>
            <select name="sort" defaultValue={filters.sort} className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2">
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Order</span>
            <select name="order" defaultValue={filters.order} className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2">
              <option value="desc">High → low</option>
              <option value="asc">Low → high</option>
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-secondary">
              Apply
            </button>
            <Link href="/admin/expenses" className="btn-secondary no-underline">
              Clear
            </Link>
            <span className="text-xs text-charcoal/55">{rows.length} row{rows.length === 1 ? "" : "s"}</span>
          </div>
        </form>
      </Card>

      <Card title="Expense log">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/55">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Client / job</th>
                <th className="py-2 pr-3">Service</th>
                <th className="py-2 pr-3">Vendor</th>
                <th className="py-2 pr-3">Item</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Pay</th>
                <th className="py-2 pr-3 text-right">Amount</th>
                <th className="py-2 pr-0 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const job = e.jobId ? jobById.get(e.jobId) : undefined;
                const client = job ? clientById.get(job.clientId) : undefined;
                return (
                  <tr key={e.id} className="border-b border-navy/5 last:border-0">
                    <td className="whitespace-nowrap py-3 pr-3">{formatDate(e.date)}</td>
                    <td className="py-3 pr-3">
                      {job && client ? (
                        <Link href={`/admin/jobs/${job.id}`} className="font-semibold text-ocean no-underline">
                          {client.name}
                        </Link>
                      ) : (
                        <span className="text-charcoal/45">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-charcoal/80">{resolveServiceLabel(e, job?.serviceType)}</td>
                    <td className="py-3 pr-3 font-semibold text-navy">{e.vendor}</td>
                    <td className="max-w-[12rem] truncate py-3 pr-3 text-charcoal/80">{e.description}</td>
                    <td className="py-3 pr-3">
                      <ExpenseCategoryBadge category={e.category} />
                    </td>
                    <td className="py-3 pr-3">
                      <ExpenseTypeBadge type={e.expenseType} />
                    </td>
                    <td className="py-3 pr-3 text-xs text-charcoal/70">{e.paymentMethod}</td>
                    <td className="py-3 pr-3 text-right font-semibold text-navy">{formatCurrency(e.amount)}</td>
                    <td className="py-3 pr-0 text-right">
                      <Link href={`/admin/expenses/${e.id}`} className="text-xs font-semibold text-ocean no-underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {rows.map((e) => {
            const job = e.jobId ? jobById.get(e.jobId) : undefined;
            const client = job ? clientById.get(job.clientId) : undefined;
            return (
              <div key={e.id} className="rounded-2xl border border-navy/10 bg-sand/20 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-charcoal/55">{formatDate(e.date)}</div>
                    <div className="mt-1 font-semibold text-navy">{e.vendor}</div>
                    <div className="text-sm text-charcoal/80">{e.description}</div>
                    {client && job ? (
                      <div className="mt-1 text-xs text-ocean">
                        <Link href={`/admin/jobs/${job.id}`} className="font-semibold no-underline">
                          {client.name}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-navy">{formatCurrency(e.amount)}</div>
                    <Link href={`/admin/expenses/${e.id}`} className="mt-2 inline-block text-xs font-semibold text-ocean no-underline">
                      Edit
                    </Link>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ExpenseCategoryBadge category={e.category} />
                  <ExpenseTypeBadge type={e.expenseType} />
                  <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-charcoal/70 ring-1 ring-navy/10">
                    {e.paymentMethod}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {rows.length === 0 ? <p className="mt-4 text-sm text-charcoal/60">No expenses match these filters.</p> : null}
      </Card>
    </div>
  );
}
