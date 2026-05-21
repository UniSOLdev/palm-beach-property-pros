export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicInvoiceByToken } from "@/lib/invoices-public";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await getPublicInvoiceByToken(token);
  if (!payload) notFound();

  const { invoice, client } = payload;
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="mx-auto max-w-2xl py-10 text-charcoal">
      <div className="rounded-2xl border border-navy/10 bg-white p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-graphite/70">Invoice</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy">
          {invoice.title || "Service invoice"}
        </h1>
        {client ? (
          <p className="mt-3 text-sm text-charcoal/80">
            <span className="font-medium text-navy">{client.full_name}</span>
            {client.phone || client.email ? (
              <span className="block text-charcoal/70">
                {[client.phone, client.email].filter(Boolean).join(" · ")}
              </span>
            ) : null}
          </p>
        ) : null}
        <p className="mt-2 text-xs capitalize text-charcoal/60">Status: {invoice.status}</p>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-wide text-graphite/80">
              <th className="py-2 pr-2">Description</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.line_items ?? []).map((row, i) => (
              <tr key={i} className="border-b border-navy/5">
                <td className="py-2 pr-2">{row.description}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{row.quantity}</td>
                <td className="py-2 text-right tabular-nums">
                  {fmt(Math.round(row.quantity * row.unit_cents))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-1 text-right text-sm">
          <p className="text-charcoal/70">
            Subtotal <span className="font-medium text-navy">{fmt(invoice.subtotal_cents)}</span>
          </p>
          <p className="text-charcoal/70">
            Tax <span className="font-medium text-navy">{fmt(invoice.tax_cents)}</span>
          </p>
          <p className="text-lg font-semibold text-navy">Total {fmt(invoice.total_cents)}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          <Link
            href={`/invoice/${token}/print`}
            className="inline-flex rounded-xl border border-navy/15 bg-graphite/5 px-4 py-2 text-sm font-semibold text-navy no-underline transition hover:bg-graphite/10"
          >
            Print / PDF
          </Link>
        </div>
      </div>
    </div>
  );
}
