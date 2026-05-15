export const dynamic = "force-dynamic";

import { PrintButton } from "@/components/print-button";
import { getPublicInvoiceByToken } from "@/lib/invoices-public";
import { notFound } from "next/navigation";

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = await getPublicInvoiceByToken(token);
  if (!payload) notFound();

  const { invoice, client } = payload;
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-charcoal print:p-6">
      <p className="text-xs uppercase tracking-wider text-graphite/70">Palm Beach Property Pros</p>
      <h1 className="mt-1 text-xl font-semibold text-navy">{invoice.title || "Invoice"}</h1>
      {client ? (
        <p className="mt-3 text-sm">
          {client.full_name}
          <br />
          <span className="text-charcoal/75">{[client.phone, client.email].filter(Boolean).join(" · ")}</span>
        </p>
      ) : null}
      <table className="mt-6 w-full text-sm">
        <tbody>
          {(invoice.line_items ?? []).map((row, i) => (
            <tr key={i} className="border-b border-navy/10">
              <td className="py-2">{row.description}</td>
              <td className="py-2 text-right">{row.quantity}</td>
              <td className="py-2 text-right tabular-nums">
                {fmt(Math.round(row.quantity * row.unit_cents))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-right text-sm">Subtotal {fmt(invoice.subtotal_cents)}</p>
      <p className="text-right text-sm">Tax {fmt(invoice.tax_cents)}</p>
      <p className="text-right text-base font-semibold text-navy">Total {fmt(invoice.total_cents)}</p>
      <div className="print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
