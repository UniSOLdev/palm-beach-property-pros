"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { markInvoiceReviewSentAction, saveInvoiceAction } from "@/lib/admin/actions";
import type { Invoice, InvoiceLineItem, InvoicePaymentStatus, PaymentMethod } from "@/lib/admin/types";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { invoiceBalanceDue, invoiceSubtotal } from "@/lib/admin/invoice-totals";
import { Card, StatusBadge } from "@/components/admin/ui";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `li_${Math.random().toString(16).slice(2)}`;
}

export function InvoiceBuilder({
  initialInvoice,
  clientName,
  mode,
  dataMode,
}: {
  initialInvoice: Invoice;
  clientName: string;
  mode: "existing" | "new";
  dataMode: "supabase" | "seed";
}) {
  const storageKey = `pbpp_invoice_draft_${initialInvoice.id}`;
  const [inv, setInv] = useState<Invoice>(initialInvoice);
  const [toast, setToast] = useState<string | null>(null);
  const [partial, setPartial] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (dataMode !== "seed" || mode !== "existing") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setInv(JSON.parse(raw) as Invoice);
    } catch {
      /* ignore */
    }
  }, [mode, storageKey, dataMode]);

  useEffect(() => {
    if (dataMode !== "seed" || mode !== "existing") return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(inv));
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [inv, mode, storageKey, dataMode]);

  const subtotal = useMemo(() => invoiceSubtotal(inv), [inv]);
  const balance = useMemo(() => invoiceBalanceDue(inv), [inv]);

  const pushToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const persistInvoice = useCallback(
    async (next: Invoice) => {
      if (dataMode !== "supabase") return { ok: true as const };
      const res = await saveInvoiceAction(next);
      if (!res.ok) return res;
      router.refresh();
      return { ok: true as const };
    },
    [dataMode, router],
  );

  const addLine = () => {
    const row: InvoiceLineItem = { id: uid(), description: "Line item", quantity: 1, unitPrice: 0 };
    setInv((i) => ({ ...i, lineItems: [...i.lineItems, row] }));
  };

  const patchLine = (id: string, patch: Partial<InvoiceLineItem>) => {
    setInv((i) => ({
      ...i,
      lineItems: i.lineItems.map((li) => (li.id === id ? { ...li, ...patch } : li)),
    }));
  };

  const removeLine = (id: string) => {
    setInv((i) => ({ ...i, lineItems: i.lineItems.filter((li) => li.id !== id) }));
  };

  const markPaid = (method: PaymentMethod) => {
    setInv((i) => {
      const sub = invoiceSubtotal(i);
      const next: Invoice = {
        ...i,
        paymentStatus: "Paid",
        paymentMethod: method,
        paidDate: new Date().toISOString().slice(0, 10),
        depositPaid: sub,
      };
      if (dataMode === "supabase") {
        startTransition(() => {
          void (async () => {
            const res = await persistInvoice(next);
            if (!res.ok) pushToast(res.error);
            else pushToast("Saved · Paid");
          })();
        });
      } else {
        pushToast("Marked paid (demo mode)");
      }
      return next;
    });
  };

  const recordPartial = () => {
    if (!partial || partial <= 0) return;
    setInv((i) => {
      const nextDeposit = i.depositPaid + partial;
      const next = { ...i, depositPaid: nextDeposit };
      const bal = invoiceBalanceDue(next);
      const next2: Invoice = {
        ...next,
        paymentStatus: (bal <= 0 ? "Paid" : "Partially Paid") as InvoicePaymentStatus,
      };
      if (dataMode === "supabase") {
        startTransition(() => {
          void (async () => {
            const res = await persistInvoice(next2);
            if (!res.ok) pushToast(res.error);
            else pushToast("Saved · Partial payment");
          })();
        });
      } else {
        pushToast("Recorded partial payment (demo mode)");
      }
      return next2;
    });
    setPartial(0);
  };

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/view/invoice/${inv.publicId}` : `/view/invoice/${inv.publicId}`;

  return (
    <div>
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-navy px-4 py-3 text-sm font-semibold text-white shadow-lift">
          {toast}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={inv.paymentStatus} />
          <span className="text-sm text-charcoal/60">
            {inv.invoiceNumber} · Due {formatDate(inv.dueDate)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            Print / PDF
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl);
              pushToast("Copied client invoice link");
            }}
          >
            Copy client view
          </button>
          <Link className="btn-secondary no-underline" href={`/view/invoice/${inv.publicId}`} target="_blank">
            Open client view
          </Link>
        </div>
      </div>

      <div id="pbpp-print-root" className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Client & job">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Client</div>
                <div className="mt-1 font-semibold text-navy">{clientName}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment status</div>
                <select
                  value={inv.paymentStatus}
                  onChange={(e) => setInv((i) => ({ ...i, paymentStatus: e.target.value as InvoicePaymentStatus }))}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none ring-ocean/30 focus:ring-2"
                >
                  {(["Unpaid", "Partially Paid", "Paid", "Overdue"] as const).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</div>
                <textarea
                  rows={3}
                  value={inv.notes}
                  onChange={(e) => setInv((i) => ({ ...i, notes: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Terms</div>
                <textarea
                  rows={2}
                  value={inv.terms}
                  onChange={(e) => setInv((i) => ({ ...i, terms: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </div>
            </div>
          </Card>

          <Card title="Line items">
            <div className="mb-3 print:hidden">
              <button type="button" className="btn-secondary" onClick={addLine}>
                Add line item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/55">
                    <th className="py-2 pr-3">Description</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2 pr-3">Unit</th>
                    <th className="py-2 pr-0 text-right">Total</th>
                    <th className="py-2 pl-2 print:hidden" />
                  </tr>
                </thead>
                <tbody>
                  {inv.lineItems.map((li) => (
                    <tr key={li.id} className="border-b border-navy/5 align-top">
                      <td className="py-2 pr-3">
                        <input
                          value={li.description}
                          onChange={(e) => patchLine(li.id, { description: e.target.value })}
                          className="w-full min-w-[220px] rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          value={li.quantity}
                          onChange={(e) => patchLine(li.id, { quantity: Number(e.target.value) })}
                          className="w-20 rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          value={li.unitPrice}
                          onChange={(e) => patchLine(li.id, { unitPrice: Number(e.target.value) })}
                          className="w-28 rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                        />
                      </td>
                      <td className="py-2 pr-0 text-right font-semibold text-navy">
                        {formatCurrency(li.quantity * li.unitPrice)}
                      </td>
                      <td className="py-2 pl-2 print:hidden">
                        <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => removeLine(li.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Totals">
            <div className="space-y-2 text-sm">
              <label className="flex justify-between gap-3">
                <span className="text-charcoal/70">Discount</span>
                <input
                  type="number"
                  min={0}
                  value={inv.discount}
                  onChange={(e) => setInv((i) => ({ ...i, discount: Number(e.target.value) }))}
                  className="w-32 rounded-lg border border-navy/15 px-2 py-1.5 text-right text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <label className="flex justify-between gap-3">
                <span className="text-charcoal/70">Deposit paid</span>
                <input
                  type="number"
                  min={0}
                  value={inv.depositPaid}
                  onChange={(e) => setInv((i) => ({ ...i, depositPaid: Number(e.target.value) }))}
                  className="w-32 rounded-lg border border-navy/15 px-2 py-1.5 text-right text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <div className="flex justify-between border-t border-navy/10 pt-3">
                <span className="text-charcoal/70">Subtotal</span>
                <span className="font-semibold text-navy">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/70">Balance due</span>
                <span className="font-semibold text-leaf">{formatCurrency(balance)}</span>
              </div>
            </div>
          </Card>

          <Card title="Payments & reviews">
            <div className="flex flex-col gap-2 print:hidden">
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Mark paid</div>
              <div className="flex flex-wrap gap-2">
                {(["Cash", "Zelle", "Card", "Check", "Other"] as const).map((m) => (
                  <button key={m} type="button" className="btn-secondary" onClick={() => markPaid(m)}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="mt-3 border-t border-navy/10 pt-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Partial payment</div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={partial}
                    onChange={(e) => setPartial(Number(e.target.value))}
                    className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none ring-ocean/30 focus:ring-2"
                  />
                  <button type="button" className="btn-primary shrink-0" onClick={recordPartial}>
                    Apply
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary mt-2"
                onClick={() => {
                  setInv((i) => ({ ...i, reviewRequestStatus: "Sent" }));
                  pushToast("Review request marked sent (demo)");
                }}
              >
                Send review request (after paid)
              </button>
            </div>
            <div className="mt-3 text-xs text-charcoal/55">
              Review status: <span className="font-semibold text-navy">{inv.reviewRequestStatus}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
