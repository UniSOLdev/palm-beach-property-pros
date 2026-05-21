"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  InvoiceLineItem,
  InvoicePaymentRow,
  InvoiceRow,
  InvoiceScopeChangeRow,
  InvoiceTemplateRow,
} from "@/lib/db-types";
import { invoiceTotalsFromLines } from "@/lib/invoice-math";

function dollarsToCents(s: string): number {
  const negative = s.trim().startsWith("-");
  const n = Number.parseFloat(s.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100) * (negative ? -1 : 1);
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fmtMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type Row = { id: string; description: string; quantity: string; unitDollars: string };
type PaymentDraft = { id: string; payment_date: string; method: InvoicePaymentRow["method"]; description: string; amountDollars: string; reference: string };
type ScopeDraft = { id: string; change_type: InvoiceScopeChangeRow["change_type"]; title: string; description: string; amountDollars: string; acknowledged_by: string };

type InvoiceWithWorkflow = InvoiceRow & {
  clients?: { full_name: string } | null;
  invoice_payments?: InvoicePaymentRow[];
  invoice_scope_changes?: InvoiceScopeChangeRow[];
};

type Props = {
  invoice: InvoiceWithWorkflow;
};

export function InvoiceEditor({ invoice: initial }: Props) {
  const [invoice, setInvoice] = useState(initial);
  const [status, setStatus] = useState(initial.status);
  const [taxDollars, setTaxDollars] = useState(centsToInput(initial.tax_cents));
  const [meta, setMeta] = useState({
    invoice_number: initial.invoice_number ?? "",
    service_address: initial.service_address ?? "",
    prepared_by: initial.prepared_by ?? "Palm Beach Property Pros",
    issue_date: initial.issue_date ?? today(),
    due_date: initial.due_date ?? "",
    scope_notes: initial.scope_notes ?? "",
    client_message: initial.client_message ?? "Thank you for your business.",
  });
  const [rows, setRows] = useState<Row[]>(() =>
    (initial.line_items ?? []).map((li) => ({
      id: crypto.randomUUID(),
      description: li.description,
      quantity: String(li.quantity),
      unitDollars: centsToInput(li.unit_cents),
    })),
  );
  const [payments, setPayments] = useState<PaymentDraft[]>(() =>
    (initial.invoice_payments ?? []).map((payment) => ({
      id: payment.id,
      payment_date: payment.payment_date || today(),
      method: payment.method,
      description: payment.description ?? "Payment received",
      amountDollars: centsToInput(payment.amount_cents),
      reference: payment.reference ?? "",
    })),
  );
  const [scopeChanges, setScopeChanges] = useState<ScopeDraft[]>(() =>
    (initial.invoice_scope_changes ?? []).map((change) => ({
      id: change.id,
      change_type: change.change_type,
      title: change.title,
      description: change.description ?? "",
      amountDollars: centsToInput(change.amount_cents),
      acknowledged_by: change.acknowledged_by ?? "",
    })),
  );
  const [templates, setTemplates] = useState<InvoiceTemplateRow[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/invoice-templates");
        const data = await res.json();
        if (!cancelled && res.ok) setTemplates((data.templates as InvoiceTemplateRow[]) ?? []);
      } catch {
        /* templates are optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const baseTotals = invoiceTotalsFromLines(lineItems, dollarsToCents(taxDollars));
  const scopeAdjustmentCents = scopeChanges.reduce((sum, change) => sum + dollarsToCents(change.amountDollars), 0);
  const totalCents = Math.max(0, baseTotals.total_cents + scopeAdjustmentCents);
  const paymentTotalCents = payments.reduce((sum, payment) => sum + Math.max(0, dollarsToCents(payment.amountDollars)), 0);
  const balanceCents = Math.max(0, totalCents - paymentTotalCents);

  function applyTemplate(template: InvoiceTemplateRow) {
    setRows(template.line_items.map((li) => ({
      id: crypto.randomUUID(),
      description: li.description,
      quantity: String(li.quantity),
      unitDollars: centsToInput(li.unit_cents),
    })));
    setMeta((m) => ({ ...m, scope_notes: template.scope_notes ?? m.scope_notes }));
    setMessage(`Loaded template: ${template.name}`);
  }

  async function saveTemplate() {
    const name = templateName.trim();
    if (!name) {
      setMessage("Template name is required");
      return;
    }
    try {
      const res = await fetch("/api/admin/invoice-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, line_items: lineItems, scope_notes: meta.scope_notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save template");
      setTemplates((current) => [...current, data.template as InvoiceTemplateRow]);
      setTemplateName("");
      setMessage("Template saved");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save template");
    }
  }

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
          payments: payments.map((payment) => ({
            payment_date: payment.payment_date,
            method: payment.method,
            description: payment.description,
            amount_cents: Math.max(0, dollarsToCents(payment.amountDollars)),
            reference: payment.reference,
          })),
          scope_changes: scopeChanges.map((change) => ({
            change_type: change.change_type,
            title: change.title,
            description: change.description,
            amount_cents: dollarsToCents(change.amountDollars),
            before_total_cents: baseTotals.total_cents,
            after_total_cents: totalCents,
            acknowledged_by: change.acknowledged_by,
          })),
          ...meta,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setInvoice(data.invoice);
      setStatus(data.invoice.status);
      setMessage(balanceCents === 0 ? "Saved · paid in full" : "Saved");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page-narrow pb-28 md:pb-0">
      <Link href="/admin/invoices" className="text-sm text-aqua no-underline hover:underline">← Invoices</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="admin-kicker">Detailed service invoice</p>
          <h1 className="admin-title mt-2">{invoice.title ?? "Invoice"}</h1>
          <p className="admin-subtitle mt-1">
            {(invoice as { clients?: { full_name?: string } }).clients?.full_name ?? "No client"} · Revision {invoice.revision_number ?? 1}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/invoice/${invoice.public_token}`} target="_blank" rel="noopener noreferrer" className="admin-action-secondary">Public view</a>
          <a href={`/invoice/${invoice.public_token}/print`} target="_blank" rel="noopener noreferrer" className="admin-action-secondary">Print / PDF</a>
        </div>
      </div>

      <section className="admin-card mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-silver">Invoice #<input className="admin-field mt-1 w-full" value={meta.invoice_number} onChange={(e) => setMeta((m) => ({ ...m, invoice_number: e.target.value }))} /></label>
          <label className="text-sm text-silver">Status<select className="admin-field mt-1 w-full" value={status} onChange={(e) => setStatus(e.target.value)}><option value="draft">Draft</option><option value="sent">Sent</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="void">Void</option></select></label>
          <label className="text-sm text-silver">Service address<input className="admin-field mt-1 w-full" value={meta.service_address} onChange={(e) => setMeta((m) => ({ ...m, service_address: e.target.value }))} /></label>
          <label className="text-sm text-silver">Prepared by<input className="admin-field mt-1 w-full" value={meta.prepared_by} onChange={(e) => setMeta((m) => ({ ...m, prepared_by: e.target.value }))} /></label>
          <label className="text-sm text-silver">Issue date<input type="date" className="admin-field mt-1 w-full" value={meta.issue_date} onChange={(e) => setMeta((m) => ({ ...m, issue_date: e.target.value }))} /></label>
          <label className="text-sm text-silver">Due date<input type="date" className="admin-field mt-1 w-full" value={meta.due_date} onChange={(e) => setMeta((m) => ({ ...m, due_date: e.target.value }))} /></label>
        </div>
      </section>

      <section className="admin-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="admin-kicker">Reusable templates</p>
            <p className="mt-1 text-sm text-silver">Load common service presets or save this invoice as a reusable template.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="admin-field" onChange={(e) => { const t = templates.find((template) => template.id === e.target.value); if (t) applyTemplate(t); }} defaultValue="">
              <option value="">Load preset</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
            <input className="admin-field" placeholder="Preset name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            <button type="button" className="admin-action-secondary" onClick={() => void saveTemplate()}>Save preset</button>
          </div>
        </div>
      </section>

      <section className="admin-card">
        <p className="admin-kicker">Service line items</p>
        <div className="mt-4 space-y-3">
          {rows.map((row, i) => (
            <div key={row.id} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-5">
              <input placeholder="Description" className="admin-field sm:col-span-3" value={row.description} onChange={(e) => { const next = [...rows]; next[i] = { ...row, description: e.target.value }; setRows(next); }} />
              <input placeholder="Qty" className="admin-field" value={row.quantity} onChange={(e) => { const next = [...rows]; next[i] = { ...row, quantity: e.target.value }; setRows(next); }} />
              <input placeholder="Unit $" className="admin-field" value={row.unitDollars} onChange={(e) => { const next = [...rows]; next[i] = { ...row, unitDollars: e.target.value }; setRows(next); }} />
            </div>
          ))}
        </div>
        <button type="button" className="mt-3 text-sm font-semibold text-aqua" onClick={() => setRows((r) => [...r, { id: crypto.randomUUID(), description: "", quantity: "1", unitDollars: "0" }])}>+ Add line</button>
      </section>

      <section className="admin-card">
        <p className="admin-kicker">Scope changes / agreed adjustments</p>
        <div className="mt-4 space-y-3">
          {scopeChanges.map((change, i) => (
            <div key={change.id} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-4">
              <select className="admin-field" value={change.change_type} onChange={(e) => { const next = [...scopeChanges]; next[i] = { ...change, change_type: e.target.value as ScopeDraft["change_type"] }; setScopeChanges(next); }}><option value="addition">Addition</option><option value="removal">Removal</option><option value="adjustment">Agreed adjustment</option><option value="note">Note</option></select>
              <input className="admin-field" placeholder="Title" value={change.title} onChange={(e) => { const next = [...scopeChanges]; next[i] = { ...change, title: e.target.value }; setScopeChanges(next); }} />
              <input className="admin-field" placeholder="Amount (+/-)" value={change.amountDollars} onChange={(e) => { const next = [...scopeChanges]; next[i] = { ...change, amountDollars: e.target.value }; setScopeChanges(next); }} />
              <input className="admin-field" placeholder="Acknowledged by" value={change.acknowledged_by} onChange={(e) => { const next = [...scopeChanges]; next[i] = { ...change, acknowledged_by: e.target.value }; setScopeChanges(next); }} />
              <textarea className="admin-field min-h-[72px] sm:col-span-4" placeholder="Scope explanation" value={change.description} onChange={(e) => { const next = [...scopeChanges]; next[i] = { ...change, description: e.target.value }; setScopeChanges(next); }} />
            </div>
          ))}
        </div>
        <button type="button" className="mt-3 text-sm font-semibold text-aqua" onClick={() => setScopeChanges((r) => [...r, { id: crypto.randomUUID(), change_type: "adjustment", title: "Agreed Price Adjustment", description: "", amountDollars: "0.00", acknowledged_by: "" }])}>+ Add scope change</button>
      </section>

      <section className="admin-card">
        <p className="admin-kicker">Payments received</p>
        <div className="mt-4 space-y-3">
          {payments.map((payment, i) => (
            <div key={payment.id} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-5">
              <input type="date" className="admin-field" value={payment.payment_date} onChange={(e) => { const next = [...payments]; next[i] = { ...payment, payment_date: e.target.value }; setPayments(next); }} />
              <select className="admin-field" value={payment.method} onChange={(e) => { const next = [...payments]; next[i] = { ...payment, method: e.target.value as PaymentDraft["method"] }; setPayments(next); }}><option value="cash">Cash</option><option value="zelle">Zelle</option><option value="card">Card</option><option value="check">Check</option><option value="venmo">Venmo</option><option value="other">Other</option></select>
              <input className="admin-field" placeholder="Description" value={payment.description} onChange={(e) => { const next = [...payments]; next[i] = { ...payment, description: e.target.value }; setPayments(next); }} />
              <input className="admin-field" placeholder="Amount" value={payment.amountDollars} onChange={(e) => { const next = [...payments]; next[i] = { ...payment, amountDollars: e.target.value }; setPayments(next); }} />
              <input className="admin-field" placeholder="Reference" value={payment.reference} onChange={(e) => { const next = [...payments]; next[i] = { ...payment, reference: e.target.value }; setPayments(next); }} />
            </div>
          ))}
        </div>
        <button type="button" className="mt-3 text-sm font-semibold text-aqua" onClick={() => setPayments((r) => [...r, { id: crypto.randomUUID(), payment_date: today(), method: "cash", description: "Payment received", amountDollars: "0.00", reference: "" }])}>+ Add payment</button>
      </section>

      <section className="admin-card">
        <p className="admin-kicker">Notes / scope explanation</p>
        <textarea className="admin-field mt-3 min-h-[140px] w-full py-3" value={meta.scope_notes} onChange={(e) => setMeta((m) => ({ ...m, scope_notes: e.target.value }))} placeholder="Explain original scope, approved additions, debris volume, adjustments, and final agreement." />
        <textarea className="admin-field mt-3 min-h-[72px] w-full py-3" value={meta.client_message} onChange={(e) => setMeta((m) => ({ ...m, client_message: e.target.value }))} placeholder="Client-facing thank you or payment confirmation." />
      </section>

      <section className="admin-card grid gap-3 sm:grid-cols-4">
        <Summary label="Subtotal" value={fmtMoney(baseTotals.subtotal_cents)} />
        <Summary label="Tax" value={fmtMoney(dollarsToCents(taxDollars))} />
        <Summary label="Adjustments" value={fmtMoney(scopeAdjustmentCents)} />
        <Summary label="Total" value={fmtMoney(totalCents)} strong />
        <Summary label="Payments" value={fmtMoney(paymentTotalCents)} />
        <Summary label="Balance" value={fmtMoney(balanceCents)} strong />
      </section>

      <div className="sticky bottom-20 z-10 mt-6 md:bottom-6 md:static">
        <button type="button" disabled={saving} onClick={() => void save()} className="admin-action-primary w-full">
          {saving ? "Saving…" : "Save invoice workflow"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-silver" aria-live="polite">{message}</p> : null}
    </div>
  );
}

function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="admin-card-flat">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-silver">{label}</p>
      <p className={`mt-1 tabular-nums ${strong ? "text-xl font-semibold text-cream" : "text-base font-semibold text-zinc-200"}`}>{value}</p>
    </div>
  );
}
