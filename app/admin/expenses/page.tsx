import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { listExpenses, listJobs } from "@/lib/admin/queries";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; expenseType?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const rows = await listExpenses({
    category: sp.category,
    expenseType: sp.expenseType,
    from: sp.from,
    to: sp.to,
  });
  const jobs = await listJobs();
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <AdminPageHeader
        title="Expenses"
        subtitle="Separate job-specific spend from reusable supplies and equipment investments for cleaner profit math."
        actions={
          <Link href="/admin/expenses/new" className="btn-primary no-underline">
            Add expense
          </Link>
        }
      />

      <Card title="Filters">
        <form className="grid gap-3 md:grid-cols-4 text-sm" method="get">
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Category</span>
            <input name="category" defaultValue={sp.category ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Expense type</span>
            <input name="expenseType" defaultValue={sp.expenseType ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">From</span>
            <input type="date" name="from" defaultValue={sp.from ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">To</span>
            <input type="date" name="to" defaultValue={sp.to ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
          </label>
          <div className="md:col-span-4 flex gap-2">
            <button type="submit" className="btn-secondary">
              Apply
            </button>
            <Link href="/admin/expenses" className="btn-secondary no-underline">
              Clear
            </Link>
          </div>
        </form>
      </Card>

      <Card className="mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/55">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Vendor</th>
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4 text-right">Amount</th>
                <th className="py-2 pr-0 text-right">Job</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const job = e.jobId ? jobs.find((j) => j.id === e.jobId) : null;
                return (
                  <tr key={e.id} className="border-b border-navy/5 last:border-0">
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="py-3 pr-4 font-semibold text-navy">{e.vendor}</td>
                    <td className="py-3 pr-4 text-charcoal/80">{e.description}</td>
                    <td className="py-3 pr-4 text-charcoal/70">{e.category}</td>
                    <td className="py-3 pr-4 text-charcoal/70">{e.expenseType}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-navy">{formatCurrency(e.amount)}</td>
                    <td className="py-3 pr-0 text-right text-xs text-charcoal/60">
                      {job ? (
                        <Link href={`/admin/jobs/${job.id}`} className="font-semibold text-ocean no-underline">
                          Link
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
