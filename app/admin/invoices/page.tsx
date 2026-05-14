import Link from "next/link";
import { AdminPageHeader, Card, StatusBadge } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/admin/format";
import { invoiceBalanceDue, invoiceSubtotal } from "@/lib/admin/invoice-totals";
import { adminSeed, getClientById } from "@/lib/admin/seed";

export default function InvoicesPage() {
  const rows = [...adminSeed.invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader
        title="Invoices"
        subtitle="Collect faster with clear balances, methods, and client-facing pages."
        actions={
          <Link href="/admin/invoices/new" className="btn-primary no-underline">
            New invoice
          </Link>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/55">
                <th className="py-2 pr-4">Invoice #</th>
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Balance</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-0 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const c = getClientById(inv.clientId);
                return (
                  <tr key={inv.id} className="border-b border-navy/5 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-navy">{inv.invoiceNumber}</td>
                    <td className="py-3 pr-4">{c?.name}</td>
                    <td className="py-3 pr-4 font-semibold text-navy">{formatCurrency(invoiceSubtotal(inv))}</td>
                    <td className="py-3 pr-4">{formatCurrency(invoiceBalanceDue(inv))}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={inv.paymentStatus} />
                    </td>
                    <td className="py-3 pr-0 text-right">
                      <Link href={`/admin/invoices/${inv.id}`} className="font-semibold text-ocean no-underline">
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
