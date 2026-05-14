"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Quote, QuoteLineItem, QuoteStatus } from "@/lib/admin/types";
import { DEFAULT_MOVEOUT_ADDONS, DEFAULT_MOVEOUT_LINE_ITEMS } from "@/lib/admin/constants";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { quoteLineTotal, quoteRemaining } from "@/lib/admin/quote-totals";
import { Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/admin/ui";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `li_${Math.random().toString(16).slice(2)}`;
}

export function QuoteBuilder({
  initialQuote,
  clientName,
  mode,
}: {
  initialQuote: Quote;
  clientName: string;
  mode: "existing" | "new";
}) {
  const storageKey = `pbpp_quote_draft_${initialQuote.id}`;

  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "existing") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Quote;
        setQuote(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [mode, storageKey]);

  useEffect(() => {
    if (mode !== "existing") return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(quote));
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [quote, mode, storageKey]);

  const lineTotal = useMemo(() => quoteLineTotal(quote), [quote]);
  const remaining = useMemo(() => quoteRemaining(quote), [quote]);

  const pushToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const updateStatus = (status: QuoteStatus) => {
    setQuote((q) => ({ ...q, status }));
    pushToast(`Status updated to ${status} (demo UI)`);
  };

  const addLineItem = () => {
    const row: QuoteLineItem = { id: uid(), description: "New line item", quantity: 1, unitPrice: 0 };
    setQuote((q) => ({ ...q, lineItems: [...q.lineItems, row] }));
  };

  const removeLineItem = (id: string) => {
    setQuote((q) => ({ ...q, lineItems: q.lineItems.filter((li) => li.id !== id) }));
  };

  const patchLineItem = (id: string, patch: Partial<QuoteLineItem>) => {
    setQuote((q) => ({
      ...q,
      lineItems: q.lineItems.map((li) => (li.id === id ? { ...li, ...patch } : li)),
    }));
  };

  const addAddon = () => {
    const row: QuoteLineItem = { id: uid(), description: "Optional add-on", quantity: 1, unitPrice: 0, isAddon: true };
    setQuote((q) => ({ ...q, optionalAddons: [...q.optionalAddons, row] }));
  };

  const removeAddon = (id: string) => {
    setQuote((q) => ({ ...q, optionalAddons: q.optionalAddons.filter((li) => li.id !== id) }));
  };

  const patchAddon = (id: string, patch: Partial<QuoteLineItem>) => {
    setQuote((q) => ({
      ...q,
      optionalAddons: q.optionalAddons.map((li) => (li.id === id ? { ...li, ...patch } : li)),
    }));
  };

  const applyMoveOutTemplate = () => {
    setQuote((q) => ({
      ...q,
      serviceType: "Move-out Cleaning",
      lineItems: DEFAULT_MOVEOUT_LINE_ITEMS.map((label) => ({
        id: uid(),
        description: label,
        quantity: 1,
        unitPrice: label === "Full move-out cleaning" ? 650 : label.includes("Refrigerator") ? 45 : 0,
      })),
      optionalAddons: DEFAULT_MOVEOUT_ADDONS.map((label) => ({
        id: uid(),
        description: label,
        quantity: 1,
        unitPrice:
          label.includes("Rug cleaning labor") ? 125 : label.includes("Patio") ? 100 : label.includes("Trash") ? 0 : 0,
        isAddon: true,
      })),
    }));
    pushToast("Loaded move-out template");
  };

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/view/quote/${quote.publicId}` : `/view/quote/${quote.publicId}`;

  return (
    <div>
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-navy px-4 py-3 text-sm font-semibold text-white shadow-lift">
          {toast}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={quote.status} />
          <span className="text-sm text-charcoal/60">
            {quote.quoteNumber} · Expires {formatDate(quote.expirationDate)}
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
              pushToast("Copied client view link");
            }}
          >
            Copy client view
          </button>
          <Link className="btn-secondary no-underline" href={`/view/quote/${quote.publicId}`} target="_blank">
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
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Service type</div>
                <input
                  value={quote.serviceType}
                  onChange={(e) => setQuote((q) => ({ ...q, serviceType: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Job address</div>
                <input
                  value={quote.jobAddress}
                  onChange={(e) => setQuote((q) => ({ ...q, jobAddress: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </div>
            </div>
          </Card>

          <Card title="Line items">
            <div className="mb-3 flex flex-wrap gap-2 print:hidden">
              <button type="button" className="btn-secondary" onClick={addLineItem}>
                Add line item
              </button>
              <button type="button" className="btn-secondary" onClick={applyMoveOutTemplate}>
                Load move-out template
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
                  {quote.lineItems.map((li) => (
                    <tr key={li.id} className="border-b border-navy/5 align-top">
                      <td className="py-2 pr-3">
                        <input
                          value={li.description}
                          onChange={(e) => patchLineItem(li.id, { description: e.target.value })}
                          className="w-full min-w-[220px] rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={li.quantity}
                          onChange={(e) => patchLineItem(li.id, { quantity: Number(e.target.value) })}
                          className="w-20 rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={li.unitPrice}
                          onChange={(e) => patchLineItem(li.id, { unitPrice: Number(e.target.value) })}
                          className="w-28 rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                        />
                      </td>
                      <td className="py-2 pr-0 text-right font-semibold text-navy">
                        {formatCurrency(li.quantity * li.unitPrice)}
                      </td>
                      <td className="py-2 pl-2 print:hidden">
                        <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => removeLineItem(li.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Optional add-ons">
            <div className="mb-3 print:hidden">
              <button type="button" className="btn-secondary" onClick={addAddon}>
                Add add-on
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
                  {quote.optionalAddons.map((li) => (
                    <tr key={li.id} className="border-b border-navy/5 align-top">
                      <td className="py-2 pr-3">
                        <input
                          value={li.description}
                          onChange={(e) => patchAddon(li.id, { description: e.target.value })}
                          className="w-full min-w-[220px] rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={li.quantity}
                          onChange={(e) => patchAddon(li.id, { quantity: Number(e.target.value) })}
                          className="w-20 rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={li.unitPrice}
                          onChange={(e) => patchAddon(li.id, { unitPrice: Number(e.target.value) })}
                          className="w-28 rounded-lg border border-navy/15 px-2 py-1.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                        />
                      </td>
                      <td className="py-2 pr-0 text-right font-semibold text-navy">
                        {formatCurrency(li.quantity * li.unitPrice)}
                      </td>
                      <td className="py-2 pl-2 print:hidden">
                        <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => removeAddon(li.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Notes & terms">
            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Customer notes</span>
              <textarea
                rows={4}
                value={quote.notes}
                onChange={(e) => setQuote((q) => ({ ...q, notes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Terms</span>
              <textarea
                rows={3}
                value={quote.terms}
                onChange={(e) => setQuote((q) => ({ ...q, terms: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Internal notes</span>
              <textarea
                rows={3}
                value={quote.internalNotes}
                onChange={(e) => setQuote((q) => ({ ...q, internalNotes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Totals">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal/70">Line items</span>
                <span className="font-semibold text-navy">{formatCurrency(lineTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/70">Deposit required</span>
                <span className="font-semibold text-navy">{quote.depositRequired ? "Yes" : "No"}</span>
              </div>
              <label className="flex items-center justify-between gap-3 pt-2">
                <span className="text-charcoal/70">Deposit amount</span>
                <input
                  type="number"
                  min={0}
                  value={quote.depositAmount}
                  onChange={(e) => setQuote((q) => ({ ...q, depositAmount: Number(e.target.value) }))}
                  className="w-32 rounded-lg border border-navy/15 px-2 py-1.5 text-right text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
              <div className="flex justify-between border-t border-navy/10 pt-3">
                <span className="text-charcoal/70">Remaining balance</span>
                <span className="font-semibold text-leaf">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </Card>

          <Card title="Workflow">
            <div className="flex flex-col gap-2 print:hidden">
              <button type="button" className="btn-secondary" onClick={() => updateStatus("Draft")}>
                Save draft
              </button>
              <button type="button" className="btn-secondary" onClick={() => updateStatus("Sent")}>
                Mark sent
              </button>
              <button type="button" className="btn-secondary" onClick={() => updateStatus("Approved")}>
                Mark approved
              </button>
              <Link
                className="btn-primary text-center no-underline"
                href={`/admin/invoices/new?fromQuote=${encodeURIComponent(quote.id)}`}
              >
                Convert to invoice
              </Link>
            </div>
            <p className="mt-3 text-xs text-charcoal/55 print:hidden">
              Drafts auto-save in this browser for existing quotes (localStorage). Wire Supabase to sync across devices.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
