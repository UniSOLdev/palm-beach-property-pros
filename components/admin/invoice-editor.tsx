"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { InvoiceLineItem, InvoiceRow } from "@/lib/db-types";
import { invoiceTotalsFromLines } from "@/lib/invoice-math";

function dollarsToCents(s: string): number {
  const n = Number.parseFloat(s.replace(/[^0-9.]/g, ""));
  return Number.isNaN(n) ? 0 : Math.round(n * 100);
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

type Row = { id: string; description: string; quantity: string; unitDollars: string };

type Props = {
  invoice: InvoiceRow & { clients?: { full_name: string } | null };
};

export function InvoiceEditor({ invoice: initial }: Props) {
  const [invoice, setInvoice] = useState(initial);
  const [status, setStatus] = useState(initial.status);
  const [taxDollars, setTaxDollars] = useState(centsToInput(initial.tax_cents));
  const [rows, setRows] = useState<Row[]>(() =>
    (initial.line_items ?? []).map((li) => ({
      id: crypto.randomUUID(),
      description: li.description,
      quantity: String(li.quantity),
      unitDollars: centsToInput(li.unit_cents),
    })),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const lineItems: InvoiceLineItem[] = useMemo(
    () =>
      rows
        .map((r) => ({
          description: r.description.trim(),
          quantity: Math.max(0, Number.parseFloat(r.quantity) || 0),
          unit_cents: dollarsToCents(r.unitDollars),
        }))
        .filter((r) => r.description.length > 0),
    [rows],
  );

  const { total_cents } = invoiceTotalsFromLines(lineItems, dollarsToCents(taxDollars));
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          tax_cents: dollarsToCents(taxDollars),
          line_items: lineItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setInvoice(data.invoice);
      setMessage("Saved");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-28 md:pb-0">
      <Link href="/admin/invoices" className="text-sm text-sky-300 no-underline hover:underline">
        ← Invoices
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">{invoice.title ?? "Invoice"}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {(invoice as { clients?: { full_name?: string } }).clients?.full_name ?? "No client"} · Total{" "}
        {fmt(total_cents)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/invoice/${invoice.public_token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-sky-200 no-underline"
        >
          Public view
        </a>
        <a
          href={`/invoice/${invoice.public_token}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-300 no-underline"
        >
          Print / PDF
        </a>
      </div>

      <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Status</span>
          <select
            className="mt-1 w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Tax ($)</span>
          <input
            className="mt-1 w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-white"
            value={taxDollars}
            onChange={(e) => setTaxDollars(e.target.value)}
          />
        </label>

        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Line items</p>
        {rows.map((row, i) => (
          <div key={row.id} className="grid gap-2 rounded-xl border border-white/5 p-3 sm:grid-cols-3">
            <input
              placeholder="Description"
              className="min-h-[44px] rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white sm:col-span-3"
              value={row.description}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, description: e.target.value };
                setRows(next);
              }}
            />
            <input
              placeholder="Qty"
              className="min-h-[44px] rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
              value={row.quantity}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, quantity: e.target.value };
                setRows(next);
              }}
            />
            <input
              placeholder="Unit $"
              className="min-h-[44px] rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
              value={row.unitDollars}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, unitDollars: e.target.value };
                setRows(next);
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="text-sm font-semibold text-sky-300"
          onClick={() =>
            setRows((r) => [...r, { id: crypto.randomUUID(), description: "", quantity: "1", unitDollars: "0" }])
          }
        >
          + Add line
        </button>
      </div>

      <div className="sticky bottom-20 z-10 mt-6 md:bottom-6 md:static">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="min-h-[48px] w-full rounded-xl bg-sky-500/90 px-5 py-3 text-sm font-semibold text-sky-950 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save invoice"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-zinc-400">{message}</p> : null}
    </div>
  );
}
