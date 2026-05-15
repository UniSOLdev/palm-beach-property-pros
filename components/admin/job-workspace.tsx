"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClientSummary } from "@/components/admin/client-combobox";
import { ClientCombobox } from "@/components/admin/client-combobox";
import { JobFileUpload } from "@/components/admin/job-file-upload";
import { NewClientModal } from "@/components/admin/new-client-modal";
import type { CrewAssignment, JobDetailPayload } from "@/lib/db-types";

type QuoteOption = { id: string; reference_code: string | null; status: string; client_id: string | null };
type InvoiceOption = {
  id: string;
  title: string | null;
  public_token: string;
  client_id: string | null;
  total_cents: number;
  quote_reference_code: string | null;
};

function embedToClientSummary(c: JobDetailPayload["clients"]): ClientSummary | null {
  if (!c) return null;
  return {
    id: c.id,
    full_name: c.full_name,
    phone: c.phone,
    email: c.email,
    created_at: "",
  };
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(s: string): string | null {
  if (!s.trim()) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function dollarsFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function centsFromDollarsInput(s: string): number {
  const n = Number.parseFloat(s.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

type Props = {
  jobId: string;
  initialJob: JobDetailPayload;
  recentClients: ClientSummary[];
};

export function JobWorkspace({ jobId, initialJob, recentClients }: Props) {
  const [job, setJob] = useState<JobDetailPayload>(initialJob);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([]);
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceOption[]>([]);
  const [revenueInput, setRevenueInput] = useState(dollarsFromCents(initialJob.revenue_cents));
  const [completedInput, setCompletedInput] = useState(toDatetimeLocalValue(initialJob.completed_at));

  const clientValue = useMemo(() => embedToClientSummary(job.clients), [job.clients]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [qRes, iRes] = await Promise.all([
          fetch("/api/admin/quotes?limit=200"),
          fetch("/api/admin/invoices?limit=200"),
        ]);
        const qj = await qRes.json();
        const ij = await iRes.json();
        if (!cancelled) {
          if (qRes.ok) setQuoteOptions((qj.quotes as QuoteOption[]) ?? []);
          if (iRes.ok) setInvoiceOptions((ij.invoices as InvoiceOption[]) ?? []);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setTimeout(() => setSaveState("idle"), 2200);
    return () => clearTimeout(t);
  }, [saveState]);

  const applyJobPatch = useCallback((patch: Partial<JobDetailPayload>) => {
    setJob((j) => ({ ...j, ...patch }));
    setDirty(true);
    setErrorMsg(null);
  }, []);

  const save = useCallback(async () => {
    setSaveState("saving");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          row_version: job.row_version,
          title: job.title,
          status: job.status,
          client_id: job.client_id,
          service_type: job.service_type,
          property_address: job.property_address,
          revenue_cents: centsFromDollarsInput(revenueInput),
          payment_method: job.payment_method,
          quote_id: job.quote_id,
          invoice_id: job.invoice_id,
          crew_assignments: job.crew_assignments,
          notes: job.notes,
          internal_notes: job.internal_notes,
          referral_source: job.referral_source,
          review_requested: job.review_requested,
          completed_at: fromDatetimeLocalValue(completedInput),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveState("error");
        setErrorMsg(data.message ?? data.error ?? "Save failed");
        return;
      }
      setJob(data.job as JobDetailPayload);
      setRevenueInput(dollarsFromCents((data.job as JobDetailPayload).revenue_cents));
      setCompletedInput(toDatetimeLocalValue((data.job as JobDetailPayload).completed_at));
      setDirty(false);
      setSaveState("saved");
    } catch {
      setSaveState("error");
      setErrorMsg("Network error");
    }
  }, [
    jobId,
    job.row_version,
    job.title,
    job.status,
    job.client_id,
    job.service_type,
    job.property_address,
    job.payment_method,
    job.quote_id,
    job.invoice_id,
    job.crew_assignments,
    job.notes,
    job.internal_notes,
    job.referral_source,
    job.review_requested,
    revenueInput,
    completedInput,
  ]);

  async function onQuoteChange(qid: string) {
    const v = qid || null;
    applyJobPatch({ quote_id: v });
    if (!v) return;
    const opt = quoteOptions.find((q) => q.id === v);
    if (!opt?.client_id) return;
    const res = await fetch(`/api/admin/clients?ids=${encodeURIComponent(opt.client_id)}`);
    const data = await res.json();
    const cl = (data.clients as ClientSummary[] | undefined)?.[0];
    if (!cl) return;
    setJob((j) => ({
      ...j,
      quote_id: v,
      client_id: cl.id,
      clients: { id: cl.id, full_name: cl.full_name, phone: cl.phone, email: cl.email },
    }));
  }

  async function onInvoiceChange(iid: string) {
    const v = iid || null;
    applyJobPatch({ invoice_id: v });
    if (!v) return;
    const opt = invoiceOptions.find((i) => i.id === v);
    if (!opt?.client_id) return;
    const res = await fetch(`/api/admin/clients?ids=${encodeURIComponent(opt.client_id)}`);
    const data = await res.json();
    const cl = (data.clients as ClientSummary[] | undefined)?.[0];
    if (!cl) return;
    setJob((j) => ({
      ...j,
      invoice_id: v,
      client_id: cl.id,
      clients: { id: cl.id, full_name: cl.full_name, phone: cl.phone, email: cl.email },
    }));
  }

  function updateCrew(i: number, patch: Partial<CrewAssignment>) {
    const next = job.crew_assignments.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    applyJobPatch({ crew_assignments: next });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400/90">Job</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {job.job_number ? (
              <span className="text-zinc-400">{job.job_number}</span>
            ) : (
              <span className="text-zinc-500">No job #</span>
            )}{" "}
            <span className="text-white">· {job.title}</span>
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">{job.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
              Unsaved changes
            </span>
          ) : null}
          {saveState === "saving" ? (
            <span className="text-xs text-zinc-400">Saving…</span>
          ) : saveState === "saved" ? (
            <span className="text-xs text-emerald-400">Saved successfully</span>
          ) : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saveState === "saving"}
            className="rounded-xl bg-sky-500/90 px-5 py-2.5 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-900/30 transition hover:bg-sky-400 disabled:opacity-50"
          >
            Save changes
          </button>
          <Link
            href="/admin/jobs"
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-zinc-300 no-underline hover:bg-white/5"
          >
            All jobs
          </Link>
        </div>
      </div>

      {errorMsg ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMsg}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/[0.06]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Client</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Client is validated against linked quote and invoice—relations stay aligned with Supabase.
        </p>
        <div className="mt-4">
          <ClientCombobox
            value={clientValue}
            onValueChange={(c) => {
              applyJobPatch({
                client_id: c?.id ?? null,
                clients: c
                  ? { id: c.id, full_name: c.full_name, phone: c.phone, email: c.email }
                  : null,
              });
            }}
            recentClients={recentClients}
            onOpenNewClient={() => setModalOpen(true)}
          />
        </div>
        <NewClientModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={async (c) => {
            applyJobPatch({
              client_id: c.id,
              clients: { id: c.id, full_name: c.full_name, phone: c.phone, email: c.email },
            });
            setModalOpen(false);
          }}
        />
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/[0.05]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Core</h2>
          <label className="mt-4 block text-xs text-zinc-500">Title</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            value={job.title}
            onChange={(e) => applyJobPatch({ title: e.target.value })}
          />
          <label className="mt-3 block text-xs text-zinc-500">Status</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            value={job.status}
            onChange={(e) => applyJobPatch({ status: e.target.value })}
          >
            {Array.from(
              new Set(["scheduled", "in_progress", "completed", "cancelled", "on_hold", job.status]),
            ).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-xs text-zinc-500">Service type</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            value={job.service_type ?? ""}
            onChange={(e) => applyJobPatch({ service_type: e.target.value || null })}
          />
          <label className="mt-3 block text-xs text-zinc-500">Property address</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            value={job.property_address ?? ""}
            onChange={(e) => applyJobPatch({ property_address: e.target.value || null })}
          />
          <label className="mt-3 block text-xs text-zinc-500">Revenue ($)</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            inputMode="decimal"
            value={revenueInput}
            onChange={(e) => {
              setRevenueInput(e.target.value);
              setDirty(true);
            }}
          />
          <label className="mt-3 block text-xs text-zinc-500">Payment method</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            value={job.payment_method ?? ""}
            onChange={(e) => applyJobPatch({ payment_method: e.target.value || null })}
          >
            <option value="">—</option>
            {["cash", "zelle", "card", "check", "venmo", "other"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-xs text-zinc-500">Completed at</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            value={completedInput}
            onChange={(e) => {
              setCompletedInput(e.target.value);
              setDirty(true);
            }}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/[0.05]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Relations</h2>
          <label className="mt-4 block text-xs text-zinc-500">Quote</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            value={job.quote_id ?? ""}
            onChange={(e) => void onQuoteChange(e.target.value)}
          >
            <option value="">None attached</option>
            {quoteOptions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.reference_code ?? q.id.slice(0, 8)} · {q.status}
              </option>
            ))}
          </select>
          {job.quote_id && job.quotes ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-200">
                Quote {job.quotes.reference_code ?? job.quotes.id.slice(0, 8)}
              </span>
              <Link
                href={`/admin/quotes/${job.quote_id}`}
                className="text-xs font-semibold text-sky-300 no-underline hover:underline"
              >
                View quote →
              </Link>
            </div>
          ) : job.quote_id ? (
            <p className="mt-2 text-xs text-zinc-500">Quote linked — save to refresh badge.</p>
          ) : null}

          <label className="mt-5 block text-xs text-zinc-500">Invoice</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            value={job.invoice_id ?? ""}
            onChange={(e) => void onInvoiceChange(e.target.value)}
          >
            <option value="">None attached</option>
            {invoiceOptions.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {(inv.quote_reference_code || inv.title || "Invoice").slice(0, 40)} ·{" "}
                {(inv.total_cents / 100).toFixed(0)} USD
              </option>
            ))}
          </select>
          {job.invoice_id && job.invoices ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                Invoice
              </span>
              <Link
                href={`/invoice/${job.invoices.public_token}`}
                className="text-xs font-semibold text-emerald-300 no-underline hover:underline"
              >
                Open invoice →
              </Link>
            </div>
          ) : job.invoice_id ? (
            <p className="mt-2 text-xs text-zinc-500">Invoice linked — save to refresh.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/[0.05]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Crew</h2>
          <button
            type="button"
            className="text-xs font-semibold text-sky-300 hover:underline"
            onClick={() => {
              setJob((j) => ({
                ...j,
                crew_assignments: [...j.crew_assignments, { name: "", role: null }],
              }));
              setDirty(true);
            }}
          >
            + Add crew
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {job.crew_assignments.length === 0 ? (
            <p className="text-sm text-zinc-500">No crew assigned yet.</p>
          ) : null}
          {job.crew_assignments.map((m, i) => (
            <div key={i} className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <input
                placeholder="Name"
                className="min-w-[8rem] flex-1 rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-sm text-white outline-none focus:border-sky-400/40"
                value={m.name}
                onChange={(e) => updateCrew(i, { name: e.target.value })}
              />
              <input
                placeholder="Role (optional)"
                className="min-w-[6rem] flex-1 rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-sm text-white outline-none focus:border-sky-400/40"
                value={m.role ?? ""}
                onChange={(e) => updateCrew(i, { role: e.target.value || null })}
              />
          <button
            type="button"
            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:bg-white/5"
            onClick={() => {
              setJob((j) => ({
                ...j,
                crew_assignments: j.crew_assignments.filter((_, idx) => idx !== i),
              }));
              setDirty(true);
            }}
          >
            Remove
          </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/[0.05]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Notes & follow-up</h2>
        <label className="mt-4 block text-xs text-zinc-500">Customer / job notes</label>
        <textarea
          className="mt-1 min-h-[5rem] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
          value={job.notes ?? ""}
          onChange={(e) => applyJobPatch({ notes: e.target.value || null })}
        />
        <label className="mt-3 block text-xs text-zinc-500">Internal notes</label>
        <textarea
          className="mt-1 min-h-[4rem] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
          value={job.internal_notes ?? ""}
          onChange={(e) => applyJobPatch({ internal_notes: e.target.value || null })}
        />
        <label className="mt-3 block text-xs text-zinc-500">Referral source</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
          value={job.referral_source ?? ""}
          onChange={(e) => applyJobPatch({ referral_source: e.target.value || null })}
        />
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={job.review_requested}
            onChange={(e) => applyJobPatch({ review_requested: e.target.checked })}
            className="rounded border-white/20 bg-black/40"
          />
          Review requested
        </label>
      </section>

      <JobFileUpload jobId={jobId} />
    </div>
  );
}
