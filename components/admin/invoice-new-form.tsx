"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClientSummary } from "@/components/admin/client-combobox";
import { ClientCombobox } from "@/components/admin/client-combobox";
import { NewClientModal } from "@/components/admin/new-client-modal";
import type { InvoiceLineItem } from "@/lib/db-types";
import { invoiceTotalsFromLines } from "@/lib/invoice-math";

function dollarsToCents(s: string): number {
  const n = Number.parseFloat(s.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

type Row = {
  id: string;
  description: string;
  quantity: string;
  unitDollars: string;
};

function newRow(): Row {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitDollars: "0",
  };
}

type InvoiceNewFormProps = {
  recentClients: ClientSummary[];
  initialClient: ClientSummary | null;
  quoteNote: string | null;
};

export function InvoiceNewForm({ recentClients, initialClient, quoteNote }: InvoiceNewFormProps) {
  const [client, setClient] = useState<ClientSummary | null>(initialClient);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [taxDollars, setTaxDollars] = useState("0");
  const [rows, setRows] = useState<Row[]>([newRow()]);
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

  const tax_cents = dollarsToCents(taxDollars);
  const { subtotal_cents, total_cents } = invoiceTotalsFromLines(lineItems, tax_cents);

  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  async function submit() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client?.id ?? null,
          title: title.trim() || null,
          status: "draft",
          tax_cents,
          line_items: lineItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not save invoice");
        return;
      }
      const token = data.invoice?.public_token as string | undefined;
      if (token) {
        window.location.href = `/invoice/${token}`;
        return;
      }
      setMessage("Saved. Public link unavailable.");
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {quoteNote ? (
        <p className="rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-100/95">
          {quoteNote}
        </p>
      ) : null}

      <ClientCombobox
        value={client}
        onValueChange={setClient}
        recentClients={recentClients}
        onOpenNewClient={() => setModalOpen(true)}
      />

      <NewClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(c) => {
          setClient(c);
          setModalOpen(false);
        }}
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/[0.05]">
        <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Invoice title</label>
        <input
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/40"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Exterior service — March visit"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/[0.05]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Line items</h2>
          <button
            type="button"
            onClick={() => setRows((r) => [...r, newRow()])}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5"
          >
            + Row
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-5">
                <label className="text-[10px] uppercase tracking-wide text-zinc-500">Description</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-2 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                  value={row.description}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) => (x.id === row.id ? { ...x, description: e.target.value } : x)),
                    )
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-wide text-zinc-500">Qty</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-2 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                  inputMode="decimal"
                  value={row.quantity}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) => (x.id === row.id ? { ...x, quantity: e.target.value } : x)),
                    )
                  }
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] uppercase tracking-wide text-zinc-500">Unit ($)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-2 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                  inputMode="decimal"
                  value={row.unitDollars}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) => (x.id === row.id ? { ...x, unitDollars: e.target.value } : x)),
                    )
                  }
                  onBlur={() =>
                    setRows((rs) =>
                      rs.map((x) =>
                        x.id === row.id
                          ? { ...x, unitDollars: centsToInput(dollarsToCents(x.unitDollars)) }
                          : x,
                      ),
                    )
                  }
                />
              </div>
              <div className="flex items-end justify-end sm:col-span-2">
                <button
                  type="button"
                  disabled={rows.length <= 1}
                  onClick={() => setRows((rs) => rs.filter((x) => x.id !== row.id))}
                  className="rounded-lg border border-white/10 px-2 py-2 text-xs text-zinc-500 hover:bg-white/5 disabled:opacity-30"
                  aria-label={`Remove line ${idx + 1}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tax ($)</label>
            <input
              className="mt-1 w-full max-w-xs rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
              inputMode="decimal"
              value={taxDollars}
              onChange={(e) => setTaxDollars(e.target.value)}
              onBlur={() => setTaxDollars(centsToInput(dollarsToCents(taxDollars)))}
            />
          </div>
          <div className="space-y-1 text-right text-sm">
            <p className="text-zinc-500">
              Subtotal <span className="text-white">{fmt(subtotal_cents)}</span>
            </p>
            <p className="text-zinc-500">
              Tax <span className="text-white">{fmt(tax_cents)}</span>
            </p>
            <p className="text-base font-semibold text-white">Total {fmt(total_cents)}</p>
          </div>
        </div>
      </div>

      {message ? <p className="text-sm text-red-400">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving || lineItems.length === 0}
          onClick={() => void submit()}
          className="rounded-xl bg-sky-500/90 px-6 py-3 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-900/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving…" : "Create invoice"}
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-zinc-300 no-underline hover:bg-white/5"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
