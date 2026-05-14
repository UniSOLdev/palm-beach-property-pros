import Link from "next/link";
import { AdminPageHeader, Card, StatusBadge } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/admin/format";
import { quoteLineTotal } from "@/lib/admin/quote-totals";
import { listClients, listQuotes } from "@/lib/admin/queries";

export default async function QuotesPage() {
  const [quotes, clients] = await Promise.all([listQuotes(), listClients()]);
  const rows = [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader
        title="Quotes"
        subtitle="Estimates that convert cleanly into invoices when the job is sold."
        actions={
          <Link href="/admin/quotes/new" className="btn-primary no-underline">
            New quote
          </Link>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/55">
                <th className="py-2 pr-4">Quote #</th>
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-0 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => {
                const c = clients.find((x) => x.id === q.clientId);
                return (
                  <tr key={q.id} className="border-b border-navy/5 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-navy">{q.quoteNumber}</td>
                    <td className="py-3 pr-4">{c?.name}</td>
                    <td className="py-3 pr-4 text-charcoal/80">{q.serviceType}</td>
                    <td className="py-3 pr-4 font-semibold text-navy">{formatCurrency(quoteLineTotal(q))}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="py-3 pr-0 text-right">
                      <Link href={`/admin/quotes/${q.id}`} className="font-semibold text-ocean no-underline">
                        Open
                      </Link>
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
