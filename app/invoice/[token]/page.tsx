export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicInvoiceByToken } from "@/lib/invoices-public";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await getPublicInvoiceByToken(token);
  if (!payload) notFound();

  const { invoice, client, payments, scope_changes, payment_total_cents, balance_cents } = payload;
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  const dateFmt = (date: string | null) => date ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`)) : "—";

  return (
    <div className="mx-auto max-w-4xl py-8 text-charcoal">
      <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-lift">
        <header className="grid gap-6 border-b-4 border-navy bg-gradient-to-r from-white via-sky/35 to-white p-6 sm:grid-cols-[1fr_2fr] sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-ocean">Palm Beach Property Pros</p>
            <p className="mt-2 text-sm font-semibold text-navy">Professional · Reliable · Detail Oriented</p>
          </div>
          <div className="text-left sm:text-right">
            <h1 className="text-3xl font-black uppercase tracking-tight text-navy sm:text-4xl">Detailed service invoice</h1>
            <p className="mt-2 text-lg font-black uppercase italic text-red-600">{balance_cents === 0 ? "Paid in full" : invoice.status}</p>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-ocean">Thank you for your business</p>
          </div>
        </header>

        <section className="p-6 sm:p-8">
          <div className="overflow-hidden rounded-2xl border border-navy/20">
            {[
              ["Client", client?.full_name ?? "Client"],
              ["Service address", invoice.service_address ?? "—"],
              ["Date", dateFmt(invoice.issue_date ?? invoice.created_at.slice(0, 10))],
              ["Prepared by", invoice.prepared_by],
              ["Invoice #", invoice.invoice_number ?? invoice.public_token.slice(0, 10).toUpperCase()],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[8rem_1fr] border-b border-navy/15 last:border-b-0 sm:grid-cols-[12rem_1fr]">
                <div className="bg-sky/45 px-4 py-3 text-sm font-black uppercase text-navy">{label}</div>
                <div className="px-4 py-3 text-sm text-charcoal">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-navy/20">
            <div className="grid grid-cols-[1fr_8rem] bg-navy px-4 py-3 text-sm font-black uppercase tracking-wide text-white">
              <div>Description</div>
              <div className="text-right">Amount</div>
            </div>
            {(invoice.line_items ?? []).map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_8rem] border-b border-navy/10 px-4 py-3 text-sm last:border-b-0">
                <div>{row.description}</div>
                <div className="text-right tabular-nums">{fmt(Math.round(row.quantity * row.unit_cents))}</div>
              </div>
            ))}
            <TotalRow label="Subtotal" value={fmt(invoice.subtotal_cents)} />
            {scope_changes.map((change) => (
              <TotalRow key={change.id} label={change.title} value={fmt(change.amount_cents)} danger={change.amount_cents < 0} muted />
            ))}
            <TotalRow label="Total (final amount agreed)" value={fmt(invoice.total_cents)} strong />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-navy/20">
            <div className="bg-leaf/15 px-4 py-2 text-sm font-black uppercase text-green-800">Payments received</div>
            <div className="grid grid-cols-[1fr_8rem_8rem] bg-leaf/10 px-4 py-2 text-xs font-black uppercase text-green-800">
              <div>Description</div><div>Date</div><div className="text-right">Amount</div>
            </div>
            {payments.length === 0 ? (
              <div className="px-4 py-3 text-sm text-charcoal/70">No payments recorded yet.</div>
            ) : payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-[1fr_8rem_8rem] border-t border-navy/10 px-4 py-3 text-sm">
                <div>{payment.description || `${payment.method} payment received`}</div>
                <div>{payment.payment_date}</div>
                <div className="text-right tabular-nums">{fmt(payment.amount_cents)}</div>
              </div>
            ))}
            <TotalRow label="Total payments received" value={fmt(payment_total_cents)} green />
            <TotalRow label="Balance due" value={fmt(balance_cents)} strong />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-navy">Notes / scope explanation</h2>
              <div className="mt-2 whitespace-pre-line rounded-2xl border border-navy/15 bg-cream p-4 text-sm leading-relaxed text-charcoal">
                {invoice.scope_notes || "Scope notes will appear here when added by Palm Beach Property Pros."}
              </div>
            </section>
            <aside className="rounded-2xl border border-ocean/30 bg-sky/35 p-4">
              <p className="text-sm font-black uppercase text-navy">Final amount agreed</p>
              <p className="mt-2 text-3xl font-black text-green-700">{fmt(invoice.total_cents)}</p>
              <p className="mt-2 text-sm italic text-charcoal/80">{invoice.client_message || "Thank you for your understanding and for allowing Palm Beach Property Pros to serve you."}</p>
              {balance_cents === 0 ? <p className="mt-3 text-sm font-black uppercase text-green-700">Paid in full — thank you!</p> : null}
            </aside>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <Link href={`/invoice/${token}/print`} className="btn-primary">Print / PDF</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function TotalRow({ label, value, strong = false, danger = false, green = false, muted = false }: { label: string; value: string; strong?: boolean; danger?: boolean; green?: boolean; muted?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_8rem] border-t border-navy/10 px-4 py-3 text-sm ${strong ? "bg-navy font-black uppercase text-white" : muted ? "bg-cream" : "bg-white"}`}>
      <div className={danger ? "text-red-600" : green ? "text-green-800" : ""}>{label}</div>
      <div className={`text-right tabular-nums ${danger ? "text-red-600" : green ? "text-green-800" : ""}`}>{value}</div>
    </div>
  );
}
