export const dynamic = "force-dynamic";

import { PrintButton } from "@/components/print-button";
import { getPublicInvoiceByToken } from "@/lib/invoices-public";
import { notFound } from "next/navigation";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function dateFmt(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export default async function PrintInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await getPublicInvoiceByToken(token);
  if (!payload) notFound();

  const { invoice, client, payments, scope_changes, payment_total_cents, balance_cents } = payload;

  return (
    <div className="mx-auto max-w-4xl bg-white p-6 text-charcoal print:p-4">
      <div className="print:hidden mb-4">
        <PrintButton />
      </div>
      <header className="grid grid-cols-[1fr_2fr] gap-4 border-b-4 border-navy pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-ocean">Palm Beach Property Pros</p>
          <p className="mt-2 text-xs font-semibold text-navy">Professional · Reliable · Detail Oriented</p>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-black uppercase text-navy">Detailed service invoice</h1>
          <p className="text-base font-black uppercase italic text-red-600">{balance_cents === 0 ? "Final invoice" : invoice.status}</p>
          <p className="text-xs font-black uppercase tracking-widest text-ocean">Thank you for your business</p>
        </div>
      </header>

      <section className="mt-4 border border-navy/25 text-sm">
        {[
          ["Client", client?.full_name ?? "Client"],
          ["Service address", invoice.service_address ?? "—"],
          ["Date", dateFmt(invoice.issue_date ?? invoice.created_at.slice(0, 10))],
          ["Prepared by", invoice.prepared_by],
          ["Invoice #", invoice.invoice_number ?? invoice.public_token.slice(0, 10).toUpperCase()],
        ].map(([label, value]) => (
          <div key={label} className="grid grid-cols-[12rem_1fr] border-b border-navy/20 last:border-b-0">
            <div className="bg-sky/50 px-3 py-2 font-black uppercase text-navy">{label}</div>
            <div className="px-3 py-2">{value}</div>
          </div>
        ))}
      </section>

      <section className="mt-4 border border-navy/25 text-sm">
        <div className="grid grid-cols-[1fr_8rem] bg-navy px-3 py-2 font-black uppercase text-white"><div>Description</div><div className="text-right">Amount</div></div>
        {invoice.line_items.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_8rem] border-b border-navy/15 px-3 py-2">
            <div>{row.description}</div><div className="text-right">{fmt(Math.round(row.quantity * row.unit_cents))}</div>
          </div>
        ))}
        <Total label="Subtotal" value={fmt(invoice.subtotal_cents)} />
        {scope_changes.map((change) => <Total key={change.id} label={change.title} value={fmt(change.amount_cents)} danger={change.amount_cents < 0} />)}
        <Total label="Total (final amount agreed)" value={fmt(invoice.total_cents)} strong />
      </section>

      <section className="mt-4 border border-navy/25 text-sm">
        <div className="bg-leaf/15 px-3 py-2 font-black uppercase text-green-800">Payments received</div>
        {payments.map((payment) => (
          <div key={payment.id} className="grid grid-cols-[1fr_8rem_8rem] border-t border-navy/15 px-3 py-2">
            <div>{payment.description || `${payment.method} payment received`}</div><div>{payment.payment_date}</div><div className="text-right">{fmt(payment.amount_cents)}</div>
          </div>
        ))}
        <Total label="Total payments received" value={fmt(payment_total_cents)} green />
        <Total label="Balance due" value={fmt(balance_cents)} strong />
      </section>

      <section className="mt-4 grid gap-4 text-sm md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="font-black uppercase text-navy">Notes / scope explanation</h2>
          <div className="mt-2 whitespace-pre-line border border-navy/20 bg-cream p-3 leading-relaxed">{invoice.scope_notes || ""}</div>
        </div>
        <div className="border border-ocean/40 p-3">
          <p className="font-black uppercase text-navy">Final amount agreed</p>
          <p className="mt-1 text-2xl font-black text-green-700">{fmt(invoice.total_cents)}</p>
          <p className="mt-2 italic">{invoice.client_message || "Thank you for your business."}</p>
        </div>
      </section>

      <footer className="mt-5 bg-navy px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white">
        Professional. Reliable. Detail oriented. · palmbeachpropertypros.com
      </footer>
    </div>
  );
}

function Total({ label, value, strong = false, danger = false, green = false }: { label: string; value: string; strong?: boolean; danger?: boolean; green?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_8rem] border-t border-navy/15 px-3 py-2 ${strong ? "bg-navy font-black uppercase text-white" : ""}`}>
      <div className={danger ? "text-red-600" : green ? "text-green-800" : ""}>{label}</div>
      <div className={`text-right ${danger ? "text-red-600" : green ? "text-green-800" : ""}`}>{value}</div>
    </div>
  );
}
