import { formatCurrency, formatDate } from "@/lib/admin/format";
import { SITE_NAME } from "@/lib/site";

export type InvoiceLine = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type InvoiceTemplateProps = {
  invoiceNumber: string;
  clientName: string;
  clientAddress?: string | null;
  dueDate?: string | null;
  terms?: string | null;
  notes?: string | null;
  lines: InvoiceLine[];
  discount?: number;
  depositPaid?: number;
  logoUrl?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
};

export function InvoiceTemplate(props: InvoiceTemplateProps) {
  const subtotal = props.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const discount = props.discount ?? 0;
  const deposit = props.depositPaid ?? 0;
  const total = subtotal - discount - deposit;

  return (
    <article className="mx-auto max-w-3xl rounded-3xl border border-navy/10 bg-white p-8 shadow-lift print:shadow-none print:border-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-navy/10 pb-8">
        <div>
          {props.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.logoUrl} alt="" className="mb-4 h-12 w-auto" />
          ) : (
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ocean">{SITE_NAME}</p>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-navy">Invoice</h1>
          <p className="mt-1 text-sm text-charcoal/70">#{props.invoiceNumber}</p>
        </div>
        <div className="text-right text-sm text-charcoal/80">
          <p className="font-semibold text-navy">{SITE_NAME}</p>
          {props.businessPhone ? <p>{props.businessPhone}</p> : null}
          {props.businessEmail ? <p>{props.businessEmail}</p> : null}
        </div>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">Bill to</p>
          <p className="mt-2 font-semibold text-navy">{props.clientName}</p>
          {props.clientAddress ? <p className="text-sm text-charcoal/75">{props.clientAddress}</p> : null}
        </div>
        <div className="text-sm sm:text-right">
          {props.dueDate ? (
            <p>
              <span className="text-charcoal/50">Due </span>
              <span className="font-semibold text-navy">{formatDate(props.dueDate)}</span>
            </p>
          ) : null}
        </div>
      </section>

      <table className="mt-10 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/50">
            <th className="pb-3 pr-4">Description</th>
            <th className="pb-3 pr-4 text-right">Qty</th>
            <th className="pb-3 pr-4 text-right">Rate</th>
            <th className="pb-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {props.lines.map((line, i) => (
            <tr key={i} className="border-b border-navy/5">
              <td className="py-4 pr-4 text-navy">{line.description}</td>
              <td className="py-4 pr-4 text-right tabular-nums">{line.quantity}</td>
              <td className="py-4 pr-4 text-right tabular-nums">{formatCurrency(line.unit_price)}</td>
              <td className="py-4 text-right font-medium tabular-nums text-navy">
                {formatCurrency(line.quantity * line.unit_price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="mt-8 space-y-2 border-t border-navy/10 pt-6 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-charcoal/70">
            <span>Discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        ) : null}
        {deposit > 0 ? (
          <div className="flex justify-between text-charcoal/70">
            <span>Deposit paid</span>
            <span>-{formatCurrency(deposit)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-lg font-bold text-navy">
          <span>Total due</span>
          <span>{formatCurrency(total)}</span>
        </div>
        {props.terms ? <p className="pt-4 text-xs text-charcoal/65">{props.terms}</p> : null}
        {props.notes ? <p className="text-xs text-charcoal/65">{props.notes}</p> : null}
      </footer>
    </article>
  );
}
