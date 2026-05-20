"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { getChangeOrderDetail, saveChangeOrder } from "@/lib/admin/actions/change-orders";
import { calculateChangeOrderTotals, changeOrderPublicUrl } from "@/lib/admin/change-order-utils";
import { formatCurrency } from "@/lib/admin/format";
import type { ChangeOrderLineInput } from "@/lib/admin/types-change-orders";

type Prefill = {
  job_id: string;
  client_id: string;
  title: string;
  scope_change_reason: string;
  notes: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  address?: string;
  service_type?: string;
};

type Client = { id: string; name: string };

export function ChangeOrderBuilder({
  clients,
  jobs,
  prefill,
  existingId,
  initialLines,
  initialTaxRate = 0,
}: {
  clients: Client[];
  jobs: { id: string; label: string; client_id: string }[];
  prefill?: Prefill;
  existingId?: string;
  initialLines?: ChangeOrderLineInput[];
  initialTaxRate?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [jobId, setJobId] = useState(prefill?.job_id ?? "");
  const [clientId, setClientId] = useState(prefill?.client_id ?? "");
  const [title, setTitle] = useState(prefill?.title ?? "Change Order");
  const [reason, setReason] = useState(prefill?.scope_change_reason ?? "");
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const [clientName, setClientName] = useState(prefill?.client_name ?? "");
  const [clientEmail, setClientEmail] = useState(prefill?.client_email ?? "");
  const [clientPhone, setClientPhone] = useState(prefill?.client_phone ?? "");
  const [taxRate, setTaxRate] = useState(initialTaxRate);
  const [lines, setLines] = useState<ChangeOrderLineInput[]>(
    initialLines?.length ? initialLines : [{ description: "", quantity: 1, unit_price: 0 }],
  );

  const totals = useMemo(() => calculateChangeOrderTotals(lines.filter((l) => l.description.trim()), taxRate), [lines, taxRate]);

  function onJobChange(id: string) {
    setJobId(id);
    const job = jobs.find((j) => j.id === id);
    if (job) setClientId(job.client_id);
  }

  return (
    <div className="space-y-4 pb-28">
      <form
        id="co-form"
        className="admin-card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            setError("");
            try {
              const id = await saveChangeOrder({
                id: existingId,
                job_id: jobId,
                client_id: clientId,
                title,
                scope_change_reason: reason,
                notes,
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                tax_rate: taxRate,
                lines: lines.filter((l) => l.description.trim()),
              });
              router.push(`/admin/change-orders/${id}`);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save");
            }
          });
        }}
      >
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {prefill?.address ? (
          <p className="text-xs text-charcoal/60">
            {prefill.service_type} · {prefill.address}
          </p>
        ) : null}

        <label className="block text-sm font-medium text-navy">
          Job
          <select
            required
            className="admin-input"
            value={jobId}
            onChange={(e) => onJobChange(e.target.value)}
            disabled={!!prefill?.job_id && !!existingId}
          >
            <option value="">Select job</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-navy">
          Client
          <select
            required
            className="admin-input"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-navy">
          Title
          <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label className="block text-sm font-medium text-navy">
          Scope change reason
          <textarea
            className="admin-input"
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe what is changing and why…"
          />
        </label>

        <label className="block text-sm font-medium text-navy">
          Notes (optional)
          <textarea className="admin-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-medium text-navy">
            Client name
            <input className="admin-input" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-navy">
            Email
            <input type="email" className="admin-input" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-navy">
            Phone
            <input type="tel" className="admin-input" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
          </label>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-navy">Line items</p>
          {lines.map((line, i) => (
            <div key={i} className="rounded-xl border border-navy/10 bg-white p-3 space-y-2">
              <input
                className="admin-input mt-0"
                placeholder="Description"
                value={line.description}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], description: e.target.value };
                  setLines(next);
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="admin-input mt-0"
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...next[i], quantity: Number(e.target.value) };
                    setLines(next);
                  }}
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="admin-input mt-0"
                  placeholder="Unit price"
                  value={line.unit_price}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...next[i], unit_price: Number(e.target.value) };
                    setLines(next);
                  }}
                />
              </div>
              {lines.length > 1 ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 min-h-[44px]"
                  onClick={() => setLines(lines.filter((_, idx) => idx !== i))}
                >
                  Remove line
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="admin-btn-secondary w-full min-h-[48px]"
            onClick={() => setLines([...lines, { description: "", quantity: 1, unit_price: 0 }])}
          >
            + Add line
          </button>
        </div>

        <label className="block text-sm font-medium text-navy">
          Tax rate (decimal, e.g. 0.07)
          <input
            type="number"
            step="0.0001"
            min={0}
            max={1}
            className="admin-input"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          />
        </label>

        <div className="rounded-xl bg-sand/50 px-4 py-3 text-sm">
          <p>
            Subtotal: <strong>{formatCurrency(totals.subtotal)}</strong>
          </p>
          {taxRate > 0 ? (
            <p>
              Tax: <strong>{formatCurrency(totals.tax_amount)}</strong>
            </p>
          ) : null}
          <p className="text-lg font-bold text-navy">Total: {formatCurrency(totals.total)}</p>
        </div>
      </form>

      {shareUrl ? (
        <div className="admin-card space-y-2">
          <p className="text-sm font-semibold text-navy">Approval link</p>
          <input readOnly className="admin-input text-xs" value={shareUrl} onFocus={(e) => e.target.select()} />
          <Link href={shareUrl} target="_blank" className="admin-btn-secondary inline-flex min-h-[48px] no-underline">
            Open preview
          </Link>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-navy/10 bg-cream/95 px-3 py-2 backdrop-blur-md pb-safe">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row">
          <button type="submit" form="co-form" disabled={pending} className="admin-btn min-h-[52px] flex-1">
            Save draft
          </button>
          <button
            type="button"
            disabled={pending || !jobId}
            className="admin-btn-secondary min-h-[52px] flex-1"
            onClick={() =>
              startTransition(async () => {
                setError("");
                try {
                  const id = await saveChangeOrder({
                    id: existingId,
                    job_id: jobId,
                    client_id: clientId,
                    title,
                    scope_change_reason: reason,
                    notes,
                    client_name: clientName,
                    client_email: clientEmail,
                    client_phone: clientPhone,
                    tax_rate: taxRate,
                    lines: lines.filter((l) => l.description.trim()),
                    mark_sent: true,
                  });
                  const detail = await getChangeOrderDetail(id);
                  const url = detail ? changeOrderPublicUrl(detail.order.public_id) : "";
                  setShareUrl(url);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not send");
                }
              })
            }
          >
            Save &amp; mark sent
          </button>
        </div>
      </div>
    </div>
  );
}
