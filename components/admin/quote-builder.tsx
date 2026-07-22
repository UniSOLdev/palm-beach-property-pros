"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveQuoteEstimate } from "@/lib/admin/actions/quote-estimates";
import { formatCurrency } from "@/lib/admin/format";
import { calculateEstimateTotals, type QuoteLineInput } from "@/lib/platform/modules/estimates";
import { AiAssistPanel } from "@/components/platform/ai-assist-panel";

type Props = {
  quoteId: string;
  clientId: string;
  initial: {
    service_type: string;
    job_address: string;
    notes?: string | null;
    internal_notes?: string | null;
    terms?: string | null;
    expiration_date?: string | null;
    deposit_required?: boolean;
    deposit_amount?: number;
    discount_type?: "percent" | "fixed" | null;
    discount_value?: number;
    tax_rate?: number;
    lines: QuoteLineInput[];
  };
};

export function QuoteBuilder({ quoteId, clientId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(initial);

  const totals = useMemo(
    () =>
      calculateEstimateTotals(form.lines, {
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        tax_rate: form.tax_rate,
      }),
    [form],
  );

  function updateLine(index: number, patch: Partial<QuoteLineInput>) {
    setForm((prev) => {
      const lines = [...prev.lines];
      lines[index] = { ...lines[index], ...patch };
      return { ...prev, lines };
    });
  }

  function onSave() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        await saveQuoteEstimate(quoteId, {
          client_id: clientId,
          service_type: form.service_type,
          job_address: form.job_address,
          notes: form.notes,
          internal_notes: form.internal_notes,
          terms: form.terms,
          expiration_date: form.expiration_date,
          deposit_required: form.deposit_required,
          deposit_amount: form.deposit_amount,
          discount_type: form.discount_type,
          discount_value: form.discount_value,
          tax_rate: form.tax_rate,
          lines: form.lines.filter((l) => l.description.trim()),
        });
        setSuccess("Estimate saved.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-4 pb-28">
      {error ? <div className="admin-card text-sm text-red-700">{error}</div> : null}
      {success ? <div className="admin-card text-sm text-leaf">{success}</div> : null}

      <label className="block text-sm">
        <span className="font-medium text-navy">Service</span>
        <input
          value={form.service_type}
          onChange={(e) => setForm((p) => ({ ...p, service_type: e.target.value }))}
          className="admin-input mt-1"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Property address</span>
        <input
          value={form.job_address}
          onChange={(e) => setForm((p) => ({ ...p, job_address: e.target.value }))}
          className="admin-input mt-1"
        />
      </label>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-navy">Line items</p>
        {form.lines.map((line, index) => (
          <div key={index} className="rounded-xl border border-navy/10 p-3">
            <input
              className="admin-input mt-0"
              placeholder="Description"
              value={line.description}
              onChange={(e) => updateLine(index, { description: e.target.value })}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="number"
                className="admin-input mt-0"
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
              />
              <input
                type="number"
                className="admin-input mt-0"
                placeholder="Rate"
                value={line.unit_price}
                onChange={(e) => updateLine(index, { unit_price: Number(e.target.value) })}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="admin-btn-secondary w-full min-h-[48px]"
          onClick={() =>
            setForm((p) => ({
              ...p,
              lines: [...p.lines, { description: "", quantity: 1, unit_price: 0 }],
            }))
          }
        >
          Add line item
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-navy">Discount type</span>
          <select
            value={form.discount_type ?? ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                discount_type: (e.target.value || null) as "percent" | "fixed" | null,
              }))
            }
            className="admin-input mt-1"
          >
            <option value="">None</option>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy">Discount value</span>
          <input
            type="number"
            value={form.discount_value ?? 0}
            onChange={(e) => setForm((p) => ({ ...p, discount_value: Number(e.target.value) }))}
            className="admin-input mt-1"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-navy">Expiration date</span>
        <input
          type="date"
          value={form.expiration_date ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, expiration_date: e.target.value || null }))}
          className="admin-input mt-1"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Customer notes</span>
        <textarea
          rows={3}
          value={form.notes ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          className="admin-input mt-1"
        />
      </label>

      <AiAssistPanel
        task="customer_email"
        label="Draft customer email"
        context={`Estimate for ${form.service_type} at ${form.job_address}. Total ${formatCurrency(totals.total)}.`}
      />

      <div className="admin-card space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 ? (
          <div className="flex justify-between text-charcoal/70">
            <span>Discount</span>
            <span>-{formatCurrency(totals.discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-navy/10 pt-2 text-base font-bold text-navy">
          <span>Total</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-navy/10 bg-cream/95 px-4 py-3 backdrop-blur">
        <button type="button" disabled={pending} onClick={onSave} className="admin-btn min-h-[52px] w-full">
          {pending ? "Saving…" : "Save estimate"}
        </button>
      </div>
    </div>
  );
}
