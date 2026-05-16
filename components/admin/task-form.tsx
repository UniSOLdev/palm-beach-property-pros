"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/constants";
import type { AdminTaskRow } from "@/lib/tasks/types";

type Option = { id: string; label: string };

type Props = {
  mode: "create" | "edit";
  initial?: AdminTaskRow;
  defaults?: {
    client_id?: string;
    job_id?: string;
    quote_id?: string;
    invoice_id?: string;
  };
};

export function TaskForm({ mode, initial, defaults }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "Open");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "Normal");
  const [category, setCategory] = useState(initial?.category ?? "Other");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [dueTime, setDueTime] = useState(initial?.due_time ?? "");
  const [internalNotes, setInternalNotes] = useState(initial?.internal_notes ?? "");
  const [crewId, setCrewId] = useState(initial?.assigned_crew_member_id ?? "");
  const [clientId, setClientId] = useState(initial?.client_id ?? defaults?.client_id ?? "");
  const [jobId, setJobId] = useState(initial?.job_id ?? defaults?.job_id ?? "");
  const [quoteId, setQuoteId] = useState(initial?.quote_id ?? defaults?.quote_id ?? "");
  const [invoiceId, setInvoiceId] = useState(initial?.invoice_id ?? defaults?.invoice_id ?? "");
  const [crew, setCrew] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [jobs, setJobs] = useState<Option[]>([]);
  const [quotes, setQuotes] = useState<Option[]>([]);
  const [invoices, setInvoices] = useState<Option[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const readOnlyDemo = initial?.id.startsWith("demo-") ?? false;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [crewRes, clientRes, jobRes, quoteRes, invRes] = await Promise.all([
          fetch("/api/admin/crew?active=1"),
          fetch("/api/admin/clients?limit=100"),
          fetch("/api/admin/jobs?limit=100"),
          fetch("/api/admin/quotes?limit=100"),
          fetch("/api/admin/invoices?limit=100"),
        ]);
        if (cancelled) return;
        const crewJ = await crewRes.json();
        const clientJ = await clientRes.json();
        const jobJ = await jobRes.json();
        const quoteJ = await quoteRes.json();
        const invJ = await invRes.json();
        if (crewRes.ok) {
          setCrew(
            (crewJ.crew ?? []).map((c: { id: string; full_name: string }) => ({
              id: c.id,
              label: c.full_name,
            })),
          );
        }
        if (clientRes.ok) {
          setClients(
            (clientJ.clients ?? []).map((c: { id: string; full_name: string }) => ({
              id: c.id,
              label: c.full_name,
            })),
          );
        }
        if (jobRes.ok) {
          setJobs(
            (jobJ.jobs ?? []).map((j: { id: string; title: string }) => ({
              id: j.id,
              label: j.title,
            })),
          );
        }
        if (quoteRes.ok) {
          setQuotes(
            (quoteJ.quotes ?? []).map((q: { id: string; reference_code: string | null }) => ({
              id: q.id,
              label: q.reference_code ?? q.id.slice(0, 8),
            })),
          );
        }
        if (invRes.ok) {
          setInvoices(
            (invJ.invoices ?? []).map((i: { id: string; title: string | null }) => ({
              id: i.id,
              label: i.title ?? i.id.slice(0, 8),
            })),
          );
        }
      } catch {
        /* optional relations */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!title.trim()) {
      setMessage("Title is required");
      return;
    }
    setSaving(true);
    setMessage(null);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      category,
      due_date: dueDate || null,
      due_time: dueTime || null,
      assigned_crew_member_id: crewId || null,
      client_id: clientId || null,
      job_id: jobId || null,
      quote_id: quoteId || null,
      invoice_id: invoiceId || null,
      internal_notes: internalNotes.trim() || null,
    };

    try {
      const url = mode === "create" ? "/api/admin/tasks" : `/api/admin/tasks/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push(`/admin/tasks/${data.task.id}`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: "complete" | "reopen" | "archive") {
    if (!initial || readOnlyDemo) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/tasks/${initial.id}`, {
        method: action === "archive" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      if (action === "archive") {
        router.push("/admin/tasks");
        return;
      }
      if (data.task) {
        setStatus(data.task.status);
      }
      setMessage(action === "complete" ? "Marked complete" : "Reopened");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    "mt-1 w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-sky-400/40";

  return (
    <div className="mx-auto max-w-2xl pb-28 md:pb-0">
      <Link href="/admin/tasks" className="text-sm text-sky-300 no-underline hover:underline">
        ← Tasks
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">
        {mode === "create" ? "New task" : "Edit task"}
      </h1>
      {readOnlyDemo ? (
        <p className="mt-2 text-sm text-amber-200/80">Demo task — read-only until Supabase migration is applied.</p>
      ) : null}

      <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Title *</span>
          <input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} disabled={readOnlyDemo} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Description</span>
          <textarea
            rows={3}
            className={`${fieldClass} min-h-[5rem]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={readOnlyDemo}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-zinc-300">Status</span>
            <select
              className={fieldClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              disabled={readOnlyDemo}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-300">Priority</span>
            <select
              className={fieldClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={readOnlyDemo}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Category</span>
          <select className={fieldClass} value={category} onChange={(e) => setCategory(e.target.value)} disabled={readOnlyDemo}>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-zinc-300">Due date</span>
            <input type="date" className={fieldClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={readOnlyDemo} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-300">Due time</span>
            <input type="time" className={fieldClass} value={dueTime} onChange={(e) => setDueTime(e.target.value)} disabled={readOnlyDemo} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Assigned crew</span>
          <select className={fieldClass} value={crewId} onChange={(e) => setCrewId(e.target.value)} disabled={readOnlyDemo}>
            <option value="">Unassigned</option>
            {crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Related client</span>
          <select className={fieldClass} value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={readOnlyDemo}>
            <option value="">None</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Related job</span>
          <select className={fieldClass} value={jobId} onChange={(e) => setJobId(e.target.value)} disabled={readOnlyDemo}>
            <option value="">None</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Related quote</span>
          <select className={fieldClass} value={quoteId} onChange={(e) => setQuoteId(e.target.value)} disabled={readOnlyDemo}>
            <option value="">None</option>
            {quotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Related invoice</span>
          <select className={fieldClass} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} disabled={readOnlyDemo}>
            <option value="">None</option>
            {invoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Internal notes</span>
          <textarea
            rows={2}
            className={`${fieldClass} min-h-[4rem]`}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            disabled={readOnlyDemo}
          />
        </label>
      </div>

      <div className="sticky bottom-20 z-10 mt-6 flex flex-col gap-2 sm:flex-row md:bottom-6 md:static">
        {!readOnlyDemo ? (
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="min-h-[48px] flex-1 rounded-xl bg-sky-500/90 px-5 py-3 text-sm font-semibold text-sky-950 disabled:opacity-60"
          >
            {saving ? "Saving…" : mode === "create" ? "Create task" : "Save changes"}
          </button>
        ) : null}
        {mode === "edit" && initial && !readOnlyDemo ? (
          <>
            {status !== "Completed" ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => runAction("complete")}
                className="min-h-[48px] rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-100"
              >
                Complete
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => runAction("reopen")}
                className="min-h-[48px] rounded-xl border border-white/15 px-4 text-sm font-semibold text-zinc-200"
              >
                Reopen
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => runAction("archive")}
              className="min-h-[48px] rounded-xl border border-red-400/20 px-4 text-sm font-semibold text-red-200/90"
            >
              Archive
            </button>
          </>
        ) : null}
      </div>
      {message ? <p className="mt-3 text-sm text-zinc-400">{message}</p> : null}
    </div>
  );
}
