import { notFound } from "next/navigation";
import { PrintButton } from "@/components/view/print-button";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { invoiceBalanceDue, invoiceSubtotal } from "@/lib/admin/invoice-totals";
import { adminSeed, getClientById, getInvoiceByPublicId } from "@/lib/admin/seed";

export default async function PublicInvoicePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const inv = getInvoiceByPublicId(decodeURIComponent(publicId));
  if (!inv) notFound();
  const client = getClientById(inv.clientId);
  const brand = adminSeed.businessSettings;

  const subtotal = invoiceSubtotal(inv);
  const balance = invoiceBalanceDue(inv);

  return (
    <div className="rounded-3xl border border-navy/10 bg-white p-8 shadow-card print:shadow-none">
      <header className="border-b border-navy/10 pb-6">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-ocean">Invoice</div>
        <h1 className="mt-2 text-3xl font-bold text-navy">{brand.businessName}</h1>
        <p className="mt-2 text-sm text-charcoal/70">
          {brand.phone} · {brand.email}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-sky px-3 py-1 font-semibold text-navy">{inv.invoiceNumber}</span>
          <span className="rounded-full border border-navy/15 px-3 py-1 font-semibold text-navy">{inv.paymentStatus}</span>
          <span className="rounded-full border border-navy/15 px-3 py-1 font-semibold text-navy">
            Due {formatDate(inv.dueDate)}
          </span>
        </div>
      </header>

      <section className="mt-6 grid gap-4 text-sm md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Bill to</div>
          <div className="mt-1 text-lg font-semibold text-navy">{client?.name}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment method on file</div>
          <div className="mt-1 font-semibold text-navy">{inv.paymentMethod ?? "—"}</div>
          {inv.paidDate ? (
            <div className="mt-2 text-xs text-charcoal/60">Paid date: {formatDate(inv.paidDate)}</div>
          ) : null}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70">Line items</h2>
        <div className="mt-3 divide-y divide-navy/10 rounded-2xl border border-navy/10">
          {inv.lineItems.map((li) => (
            <div key={li.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <div className="font-semibold text-navy">{li.description}</div>
                <div className="text-xs text-charcoal/55">
                  {li.quantity} × {formatCurrency(li.unitPrice)}
                </div>
              </div>
              <div className="font-semibold text-navy">{formatCurrency(li.quantity * li.unitPrice)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-3 rounded-2xl bg-sky/40 p-5 text-sm md:grid-cols-2">
        <div className="flex justify-between md:col-span-2">
          <span className="text-charcoal/70">Discounts</span>
          <span className="font-semibold text-navy">{formatCurrency(inv.discount)}</span>
        </div>
        <div className="flex justify-between md:col-span-2">
          <span className="text-charcoal/70">Deposits / payments applied</span>
          <span className="font-semibold text-navy">{formatCurrency(inv.depositPaid)}</span>
        </div>
        <div className="flex justify-between md:col-span-2 border-t border-navy/10 pt-3">
          <span className="text-charcoal/70">Subtotal</span>
          <span className="text-xl font-bold text-navy">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between md:col-span-2">
          <span className="text-charcoal/70">Balance due</span>
          <span className="text-2xl font-bold text-leaf">{formatCurrency(balance)}</span>
        </div>
      </section>

      <section className="mt-8 text-sm leading-relaxed text-charcoal/80">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70">Notes</h2>
        <p className="mt-2 whitespace-pre-line">{inv.notes}</p>
        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-navy/70">Terms</h3>
        <p className="mt-2 whitespace-pre-line">{inv.terms}</p>
        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-navy/70">Review request</h3>
        <p className="mt-2">{inv.reviewRequestStatus}</p>
      </section>

      <footer className="mt-10 border-t border-navy/10 pt-6 text-center text-xs text-charcoal/55 print:hidden">
        <PrintButton />
      </footer>
    </div>
  );
}
