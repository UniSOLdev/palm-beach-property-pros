import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { adminSeed, getJobById } from "@/lib/admin/seed";

export default function ExpensesPage() {
  const rows = [...adminSeed.expenses].sort((a, b) => b.date.localeCompare(a.date));

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

      <Card>
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
              {rows.map((e) => {
                const job = e.jobId ? getJobById(e.jobId) : null;
                return (
                  <tr key={e.id} className="border-b border-navy/5 last:border-0">
                    <td className="py-3 pr-4 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="py-3 pr-4 font-semibold text-navy">{e.vendor}</td>
                    <td className="py-3 pr-4 text-charcoal/80">{e.description}</td>
                    <td className="py-3 pr-4 text-charcoal/70">{e.category}</td>
                    <td className="py-3 pr-4 text-charcoal/70">{e.expenseType}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-navy">{formatCurrency(e.amount)}</td>
                    <td className="py-3 pr-0 text-right text-xs text-charcoal/60">
                      {job ? <Link href={`/admin/jobs/${job.id}`} className="font-semibold text-ocean no-underline">Link</Link> : "—"}
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
