"use client";

import { useCallback, useState } from "react";

import { quickMarkInvoicePaidAction, quickSetInvoicePaymentMethodAction } from "@/lib/admin/actions";
import type { PaymentMethod } from "@/lib/admin/types";

const METHODS: PaymentMethod[] = ["Cash", "Zelle", "Card", "Check", "Square Invoice", "Other"];

export function InvoicePaymentToolbar({
  invoiceId,
  paymentInstructions,
  squareInvoiceUrl,
}: {
  invoiceId: string;
  paymentInstructions: string;
  squareInvoiceUrl: string;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const pushToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <div className="mb-6 print:hidden">
      {toast ? (
        <div className="mb-3 rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-white">{toast}</div>
      ) : null}
      <div className="flex flex-col gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-card lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                void navigator.clipboard.writeText(paymentInstructions || "—");
                pushToast("Copied payment instructions");
              }}
            >
              Copy payment instructions
            </button>
            {squareInvoiceUrl ? (
              <a href={squareInvoiceUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-center text-sm no-underline">
                Open Square payment link
              </a>
            ) : (
              <button type="button" className="btn-secondary text-sm opacity-60" disabled title="Add Square invoice URL in Settings">
                Open Square payment link
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-navy/10 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Quick mark paid</span>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <form key={m} action={quickMarkInvoicePaidAction} className="inline">
                <input type="hidden" name="id" value={invoiceId} />
                <input type="hidden" name="payment_method" value={m} />
                <button type="submit" className="rounded-lg border border-navy/15 px-2 py-1 text-xs font-semibold text-navy hover:bg-sky/40">
                  Paid · {m}
                </button>
              </form>
            ))}
          </div>
        </div>
        <form action={quickSetInvoicePaymentMethodAction} className="flex flex-wrap items-end gap-2 border-t border-navy/10 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <input type="hidden" name="id" value={invoiceId} />
          <label className="text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment method</span>
            <select name="payment_method" className="mt-1 rounded-xl border border-navy/15 bg-white px-2 py-1.5 text-sm">
              <option value="">—</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-secondary text-sm">
            Save method
          </button>
        </form>
      </div>
    </div>
  );
}
