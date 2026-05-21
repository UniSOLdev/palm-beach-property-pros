"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClientSummary } from "@/components/admin/client-combobox";
import { ClientCombobox } from "@/components/admin/client-combobox";
import { JobFileUpload } from "@/components/admin/job-file-upload";
import { NewClientModal } from "@/components/admin/new-client-modal";
import type {
  CrewAssignment,
  JobDetailPayload,
  OperationalActivityRow,
  OperationalTaskPriority,
  OperationalTaskRow,
  OperationalTaskStatus,
  TaskTemplateRow,
} from "@/lib/db-types";

type QuoteOption = { id: string; reference_code: string | null; status: string; client_id: string | null };

const TASK_STATUSES: OperationalTaskStatus[] = ["todo", "scheduled", "in_progress", "blocked", "done", "cancelled"];
const TASK_PRIORITIES: OperationalTaskPriority[] = ["urgent", "high", "normal", "low"];

const taskStatusClasses: Record<OperationalTaskStatus, string> = {
  todo: "border-zinc-500/30 bg-zinc-500/10 text-zinc-200",
  scheduled: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  in_progress: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  blocked: "border-red-400/30 bg-red-500/10 text-red-100",
  done: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  cancelled: "border-zinc-600/30 bg-zinc-700/20 text-zinc-400",
};

const taskPriorityClasses: Record<OperationalTaskPriority, string> = {
  urgent: "border-red-400/40 bg-red-500/15 text-red-100",
  high: "border-orange-400/35 bg-orange-500/10 text-orange-100",
  normal: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  low: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

type JobWorkspaceTab = "overview" | "tasks" | "crew" | "profit" | "activity" | "notes";

const WORKSPACE_TABS: { id: JobWorkspaceTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "crew", label: "Crew" },
  { id: "profit", label: "Profit" },
  { id: "activity", label: "Activity" },
  { id: "notes", label: "Notes" },
];

type ProfitabilitySummary = {
  revenue_cents: number;
  invoice_total_cents: number;
  expense_cents: number;
  net_profit_cents: number;
  margin_percent: number;
  expenses: { id: string; category: string | null; vendor: string | null; amount_cents: number; expense_date: string }[];
  categories: Record<string, number>;
};
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

function shortDateTime(iso: string | null): string {
  if (!iso) return "No due time";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "No due time";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function titleCaseToken(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
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
  const [tasks, setTasks] = useState<OperationalTaskRow[]>([]);
  const [taskState, setTaskState] = useState<"loading" | "idle" | "saving" | "error">("loading");
  const [taskError, setTaskError] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", priority: "normal" as OperationalTaskPriority });
  const [taskDrafts, setTaskDrafts] = useState<Record<string, { comment: string; photoUrl: string }>>({});
  const [activeTab, setActiveTab] = useState<JobWorkspaceTab>("overview");
  const [taskQuery, setTaskQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState<OperationalTaskStatus | "all">("all");
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplateRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [profitability, setProfitability] = useState<ProfitabilitySummary | null>(null);
  const [activity, setActivity] = useState<OperationalActivityRow[]>([]);

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
    let cancelled = false;
    setTaskState("loading");
    (async () => {
      try {
        const res = await fetch(`/api/admin/jobs/${jobId}/tasks`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setTaskState("error");
          setTaskError(data.error ?? "Could not load tasks");
          return;
        }
        setTasks((data.tasks as OperationalTaskRow[]) ?? []);
        setTaskState("idle");
      } catch {
        if (!cancelled) {
          setTaskState("error");
          setTaskError("Network error loading tasks");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [templateRes, profitRes, activityRes] = await Promise.all([
          fetch(`/api/admin/task-templates?service_type=${encodeURIComponent(job.service_type ?? "")}`),
          fetch(`/api/admin/jobs/${jobId}/profitability`),
          fetch(`/api/admin/jobs/${jobId}/activity`),
        ]);
        const [templateData, profitData, activityData] = await Promise.all([
          templateRes.json(),
          profitRes.json(),
          activityRes.json(),
        ]);
        if (cancelled) return;
        if (templateRes.ok) setTaskTemplates((templateData.templates as TaskTemplateRow[]) ?? []);
        if (profitRes.ok) setProfitability(profitData as ProfitabilitySummary);
        if (activityRes.ok) setActivity((activityData.activity as OperationalActivityRow[]) ?? []);
      } catch {
        /* non-critical panels should not block job editing */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, job.service_type]);

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

  function updateTaskLocal(taskId: string, patch: Partial<OperationalTaskRow>) {
    setTasks((rows) => rows.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
    setTaskError(null);
  }

  async function refreshActivity() {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/activity`);
      const data = await res.json();
      if (res.ok) setActivity((data.activity as OperationalActivityRow[]) ?? []);
    } catch {
      /* activity is informational */
    }
  }

  async function createTask(template?: TaskTemplateRow) {
    const title = (template?.title ?? newTask.title).trim();
    if (!title) return;
    setTaskState("saving");
    setTaskError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          priority: template?.priority ?? newTask.priority,
          recurring_rule: template?.recurring_rule ?? null,
          client_id: job.client_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create task");
      const created = data.task as OperationalTaskRow;
      setTasks((rows) => [...rows, created]);
      if (template?.operational_notes) {
        setTaskDrafts((drafts) => ({
          ...drafts,
          [created.id]: { comment: template.operational_notes ?? "", photoUrl: "" },
        }));
      }
      setNewTask({ title: "", priority: "normal" });
      setSelectedTemplateId("");
      setTaskState("idle");
      void refreshActivity();
    } catch (e) {
      setTaskState("error");
      setTaskError(e instanceof Error ? e.message : "Could not create task");
    }
  }

  async function saveTask(task: OperationalTaskRow, overrides: Partial<OperationalTaskRow> = {}) {
    const next = { ...task, ...overrides };
    const draft = taskDrafts[task.id] ?? { comment: "", photoUrl: "" };
    const photoUrl = draft.photoUrl.trim();
    const photos = photoUrl ? [...next.completion_photo_urls, photoUrl] : next.completion_photo_urls;

    updateTaskLocal(task.id, { ...overrides, completion_photo_urls: photos });
    setTaskState("saving");
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: next.title,
          status: next.status,
          priority: next.priority,
          due_at: next.due_at,
          recurring_rule: next.recurring_rule,
          assigned_crew_member_id: next.assigned_crew_member_id,
          assigned_crew_name: next.assigned_crew_name,
          completion_photo_urls: photos,
          comment_body: draft.comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save task");
      setTasks((rows) => rows.map((row) => (row.id === task.id ? (data.task as OperationalTaskRow) : row)));
      setTaskDrafts((drafts) => ({ ...drafts, [task.id]: { comment: "", photoUrl: "" } }));
      setTaskState("idle");
      void refreshActivity();
    } catch (e) {
      setTaskState("error");
      setTaskError(e instanceof Error ? e.message : "Could not save task");
      setTasks((rows) => rows.map((row) => (row.id === task.id ? task : row)));
    }
  }

  async function reorderTasks(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const current = tasks;
    const sourceIndex = current.findIndex((task) => task.id === sourceId);
    const targetIndex = current.findIndex((task) => task.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...current];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setTasks(next.map((task, index) => ({ ...task, priority_rank: index + 1 })));
    setDraggedTaskId(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordered_ids: next.map((task) => task.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reorder tasks");
      setTasks((data.tasks as OperationalTaskRow[]) ?? next);
      void refreshActivity();
    } catch (e) {
      setTasks(current);
      setTaskState("error");
      setTaskError(e instanceof Error ? e.message : "Could not reorder tasks");
    }
  }

  async function deleteTask(task: OperationalTaskRow) {
    const previous = tasks;
    setTasks((rows) => rows.filter((row) => row.id !== task.id));
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/tasks/${task.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete task");
      void refreshActivity();
    } catch (e) {
      setTasks(previous);
      setTaskState("error");
      setTaskError(e instanceof Error ? e.message : "Could not delete task");
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = taskFilter === "all" || task.status === taskFilter;
    const q = taskQuery.trim().toLowerCase();
    const matchesQuery = !q || [task.title, task.assigned_crew_name, task.recurring_rule, task.priority, task.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  const selectedTemplate = taskTemplates.find((template) => template.id === selectedTemplateId) ?? null;

  const taskCompletion = tasks.length === 0
    ? 0
    : Math.round((tasks.filter((task) => task.status === "done").length / tasks.length) * 100);

  return (
    <div className="admin-page-narrow">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="admin-kicker">Job</p>
          <h1 className="admin-title mt-1">
            {job.job_number ? (
              <span className="text-silver">{job.job_number}</span>
            ) : (
              <span className="text-silver">No job #</span>
            )}{" "}
            <span className="text-cream">· {job.title}</span>
          </h1>
          <p className="mt-1 font-mono text-xs text-silver/70">{job.id}</p>
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
            className="admin-action-primary disabled:opacity-50"
          >
            Save changes
          </button>
          <Link
            href="/admin/jobs"
            className="admin-action-secondary"
          >
            All jobs
          </Link>
        </div>
      </div>

      <nav className="admin-shell-panel sticky top-0 z-20 -mx-1 flex gap-2 overflow-x-auto rounded-2xl border p-1" aria-label="Job workspace sections">
        {WORKSPACE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-aqua/20 text-cream ring-1 ring-aqua/40"
                : "text-silver hover:bg-white/5 hover:text-cream"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {errorMsg ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMsg}
        </div>
      ) : null}

      <section className={`${activeTab === "overview" ? "" : "hidden"} admin-card`}>
        <h2 className="admin-kicker">Client</h2>
        <p className="mt-1 text-xs text-silver">
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

      <section className={`${activeTab === "overview" ? "grid" : "hidden"} gap-5 md:grid-cols-2`}>
        <div className="admin-card">
          <h2 className="admin-kicker">Core</h2>
          <label className="mt-4 block text-xs text-silver">Title</label>
          <input
            className="admin-field mt-1 w-full py-2"
            value={job.title}
            onChange={(e) => applyJobPatch({ title: e.target.value })}
          />
          <label className="mt-3 block text-xs text-silver">Status</label>
          <select
            className="admin-field mt-1 w-full py-2"
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
          <label className="mt-3 block text-xs text-silver">Service type</label>
          <input
            className="admin-field mt-1 w-full py-2"
            value={job.service_type ?? ""}
            onChange={(e) => applyJobPatch({ service_type: e.target.value || null })}
          />
          <label className="mt-3 block text-xs text-silver">Property address</label>
          <input
            className="admin-field mt-1 w-full py-2"
            value={job.property_address ?? ""}
            onChange={(e) => applyJobPatch({ property_address: e.target.value || null })}
          />
          <label className="mt-3 block text-xs text-silver">Revenue ($)</label>
          <input
            className="admin-field mt-1 w-full py-2"
            inputMode="decimal"
            value={revenueInput}
            onChange={(e) => {
              setRevenueInput(e.target.value);
              setDirty(true);
            }}
          />
          <label className="mt-3 block text-xs text-silver">Payment method</label>
          <select
            className="admin-field mt-1 w-full py-2"
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
          <label className="mt-3 block text-xs text-silver">Completed at</label>
          <input
            type="datetime-local"
            className="admin-field mt-1 w-full py-2"
            value={completedInput}
            onChange={(e) => {
              setCompletedInput(e.target.value);
              setDirty(true);
            }}
          />
        </div>

        <div className="admin-card">
          <h2 className="admin-kicker">Relations</h2>
          <label className="mt-4 block text-xs text-silver">Quote</label>
          <select
            className="admin-field mt-1 w-full py-2"
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
            <p className="mt-2 text-xs text-silver">Quote linked — save to refresh badge.</p>
          ) : null}

          <label className="mt-5 block text-xs text-silver">Invoice</label>
          <select
            className="admin-field mt-1 w-full py-2"
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
            <p className="mt-2 text-xs text-silver">Invoice linked — save to refresh.</p>
          ) : null}
        </div>
      </section>

      <section className={`${activeTab === "tasks" ? "" : "hidden"} admin-card`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="admin-kicker">Field task workflow</h2>
            <p className="mt-1 text-xs text-silver">Drag to reprioritize. Quick-complete works well from an iPhone in the field.</p>
          </div>
          <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            {taskCompletion}% complete
          </div>
        </div>

        {taskError ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {taskError}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 admin-card-flat p-3 sm:grid-cols-[1fr_9rem_auto]">
          <input
            className="admin-field"
            placeholder="Add a field task, checklist item, or follow-up"
            value={newTask.title}
            onChange={(e) => setNewTask((draft) => ({ ...draft, title: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void createTask();
              }
            }}
          />
          <select
            className="admin-field"
            value={newTask.priority}
            onChange={(e) => setNewTask((draft) => ({ ...draft, priority: e.target.value as OperationalTaskPriority }))}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {titleCaseToken(priority)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void createTask()}
            disabled={!newTask.title.trim() || taskState === "saving"}
            className="admin-action-primary disabled:opacity-50"
          >
            Add task
          </button>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_12rem_12rem_auto]">
          <input
            className="admin-field"
            placeholder="Search tasks, crew, status, recurring rules…"
            value={taskQuery}
            onChange={(e) => setTaskQuery(e.target.value)}
          />
          <select
            className="admin-field"
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value as OperationalTaskStatus | "all")}
          >
            <option value="all">All statuses</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {titleCaseToken(status)}
              </option>
            ))}
          </select>
          <select
            className="admin-field"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            <option value="">Task template</option>
            {taskTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedTemplate}
            onClick={() => selectedTemplate && void createTask(selectedTemplate)}
            className="admin-action-secondary disabled:opacity-50"
          >
            Use template
          </button>
        </div>

        {selectedTemplate?.operational_notes ? (
          <p className="mt-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
            {selectedTemplate.operational_notes}
          </p>
        ) : null}

        {taskState === "loading" ? (
          <div className="admin-card-soft mt-4 text-sm text-silver">Loading tasks…</div>
        ) : filteredTasks.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-5 text-sm text-silver">
            No matching field tasks. Clear the search/filter or add a task/template for this job.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredTasks.map((task) => {
              const draft = taskDrafts[task.id] ?? { comment: "", photoUrl: "" };
              return (
                <article
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => draggedTaskId && void reorderTasks(draggedTaskId, task.id)}
                  className={`rounded-2xl border bg-black/25 p-4 transition ${
                    draggedTaskId === task.id ? "border-sky-400/60 opacity-70" : "border-white/10"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="cursor-grab select-none text-zinc-600" aria-hidden>
                          ::
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${taskPriorityClasses[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${taskStatusClasses[task.status]}`}>
                          {titleCaseToken(task.status)}
                        </span>
                        {task.recurring_rule ? (
                          <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-100">
                            {task.recurring_rule}
                          </span>
                        ) : null}
                      </div>
                      <input
                        className="admin-field mt-3 w-full py-2 font-semibold"
                        value={task.title}
                        onChange={(e) => updateTaskLocal(task.id, { title: e.target.value })}
                        onBlur={() => void saveTask(tasks.find((row) => row.id === task.id) ?? task)}
                      />
                      <p className="mt-2 text-xs text-silver">
                        {shortDateTime(task.due_at)}
                        {task.assigned_crew_name ? ` · ${task.assigned_crew_name}` : " · Unassigned"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void saveTask(task, { status: task.status === "done" ? "in_progress" : "done" })}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-leaf px-4 text-sm font-semibold text-cream transition hover:brightness-110"
                    >
                      {task.status === "done" ? "Reopen" : "Complete"}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-xs text-silver">
                      Status
                      <select
                        className="admin-field mt-1 w-full"
                        value={task.status}
                        onChange={(e) => void saveTask(task, { status: e.target.value as OperationalTaskStatus })}
                      >
                        {TASK_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {titleCaseToken(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-silver">
                      Priority
                      <select
                        className="admin-field mt-1 w-full"
                        value={task.priority}
                        onChange={(e) => void saveTask(task, { priority: e.target.value as OperationalTaskPriority })}
                      >
                        {TASK_PRIORITIES.map((priority) => (
                          <option key={priority} value={priority}>
                            {titleCaseToken(priority)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-silver">
                      Due time
                      <input
                        type="datetime-local"
                        className="admin-field mt-1 w-full"
                        value={toDatetimeLocalValue(task.due_at)}
                        onChange={(e) => void saveTask(task, { due_at: fromDatetimeLocalValue(e.target.value) })}
                      />
                    </label>
                    <label className="text-xs text-silver">
                      Recurring
                      <select
                        className="admin-field mt-1 w-full"
                        value={task.recurring_rule ?? ""}
                        onChange={(e) => void saveTask(task, { recurring_rule: e.target.value || null })}
                      >
                        <option value="">One-time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="seasonal">Seasonal</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-silver">
                      Assigned crew
                      <input
                        list={`crew-${task.id}`}
                        className="admin-field mt-1 w-full"
                        value={task.assigned_crew_name ?? ""}
                        onChange={(e) => updateTaskLocal(task.id, { assigned_crew_name: e.target.value || null })}
                        onBlur={() => void saveTask(tasks.find((row) => row.id === task.id) ?? task)}
                        placeholder="Crew member or subcontractor"
                      />
                      <datalist id={`crew-${task.id}`}>
                        {job.crew_assignments.map((crew) => (
                          <option key={`${task.id}-${crew.name}`} value={crew.name} />
                        ))}
                      </datalist>
                    </label>
                    <label className="text-xs text-silver">
                      Completion photo URL
                      <div className="mt-1 flex gap-2">
                        <input
                          className="admin-field min-w-0 flex-1"
                          value={draft.photoUrl}
                          onChange={(e) => setTaskDrafts((drafts) => ({ ...drafts, [task.id]: { ...draft, photoUrl: e.target.value } }))}
                          placeholder="Paste upload/share URL"
                        />
                        <button
                          type="button"
                          className="admin-action-secondary px-3 text-xs"
                          onClick={() => void saveTask(task)}
                        >
                          Attach
                        </button>
                      </div>
                    </label>
                  </div>

                  {task.completion_photo_urls.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.completion_photo_urls.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noopener" className="rounded-lg border border-white/10 px-2 py-1 text-xs text-sky-300 no-underline hover:bg-white/5">
                          Photo
                        </a>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      className="admin-field"
                      value={draft.comment}
                      onChange={(e) => setTaskDrafts((drafts) => ({ ...drafts, [task.id]: { ...draft, comment: e.target.value } }))}
                      placeholder="Add a field note or client update"
                    />
                    <button
                      type="button"
                      onClick={() => void saveTask(task)}
                      className="admin-action-secondary"
                    >
                      Save note
                    </button>
                  </div>

                  {task.comments.length > 0 ? (
                    <div className="mt-3 space-y-2 admin-card-flat p-3">
                      {task.comments.slice(-3).map((comment) => (
                        <p key={comment.id} className="text-xs text-zinc-400">
                          <span className="font-semibold text-zinc-300">{comment.author}:</span> {comment.body}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-zinc-600">Updated {shortDateTime(task.updated_at)}</p>
                    <button type="button" onClick={() => void deleteTask(task)} className="min-h-[44px] rounded-xl px-3 text-xs font-semibold text-red-300 hover:bg-red-500/10">
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={`${activeTab === "crew" ? "" : "hidden"} admin-card`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="admin-kicker">Crew</h2>
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
            <p className="text-sm text-silver">No crew assigned yet.</p>
          ) : null}
          {job.crew_assignments.map((m, i) => (
            <div key={i} className="flex flex-wrap gap-2 admin-card-flat p-3">
              <input
                placeholder="Name"
                className="admin-field min-w-[8rem] flex-1 py-1.5"
                value={m.name}
                onChange={(e) => updateCrew(i, { name: e.target.value })}
              />
              <input
                placeholder="Role (optional)"
                className="admin-field min-w-[6rem] flex-1 py-1.5"
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

      <section className={`${activeTab === "profit" ? "" : "hidden"} admin-card`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="admin-kicker">Profitability summary</h2>
            <p className="mt-1 text-xs text-silver">Revenue, job-linked expenses, and net margin update from relational records.</p>
          </div>
          <Link href="/admin/expenses/import" className="min-h-[44px] rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 no-underline hover:bg-white/5">
            Import expenses
          </Link>
        </div>
        {!profitability ? (
          <div className="admin-card-soft mt-4 text-sm text-silver">Loading profitability…</div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="admin-card-flat p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-silver">Revenue</p>
                <p className="mt-1 text-xl font-semibold text-cream">{formatMoney(profitability.revenue_cents)}</p>
              </div>
              <div className="admin-card-flat p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-silver">Expenses</p>
                <p className="mt-1 text-xl font-semibold text-cream">{formatMoney(profitability.expense_cents)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-200/80">Net profit</p>
                <p className="mt-1 text-xl font-semibold text-cream">{formatMoney(profitability.net_profit_cents)}</p>
              </div>
              <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/80">Margin</p>
                <p className="mt-1 text-xl font-semibold text-cream">{profitability.margin_percent}%</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="admin-card-flat p-4">
                <h3 className="text-sm font-semibold text-cream">Cost categories</h3>
                <div className="mt-3 space-y-2">
                  {Object.entries(profitability.categories).length === 0 ? (
                    <p className="text-sm text-silver">No job-specific expenses attached yet.</p>
                  ) : Object.entries(profitability.categories).map(([category, cents]) => (
                    <div key={category} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                      <span className="text-zinc-300">{category}</span>
                      <span className="font-semibold text-cream">{formatMoney(cents)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-card-flat p-4">
                <h3 className="text-sm font-semibold text-cream">Recent job expenses</h3>
                <div className="mt-3 space-y-2">
                  {profitability.expenses.length === 0 ? (
                    <p className="text-sm text-silver">Attach imported expenses to this job for real margin tracking.</p>
                  ) : profitability.expenses.slice(0, 6).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                      <span className="min-w-0 truncate text-zinc-300">{expense.vendor ?? expense.category ?? "Expense"}</span>
                      <span className="font-semibold text-cream">{formatMoney(expense.amount_cents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <section className={`${activeTab === "activity" ? "" : "hidden"} admin-card`}>
        <h2 className="admin-kicker">Operational activity timeline</h2>
        <p className="mt-1 text-xs text-silver">Task, job, invoice, photo, and expense events appear here with actor attribution.</p>
        <div className="mt-5 space-y-3">
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-5 text-sm text-silver">
              Activity will populate as this job is updated, tasks are completed, photos are uploaded, and expenses are attached.
            </div>
          ) : activity.map((item) => (
            <div key={item.id} className="relative admin-card-flat p-4 pl-5">
              <span className="absolute left-0 top-5 h-3 w-3 -translate-x-1/2 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.6)]" aria-hidden />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-cream">{item.title}</p>
                  {item.body ? <p className="mt-1 text-xs text-silver">{item.body}</p> : null}
                </div>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  {item.actor_name}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-zinc-600">{shortDateTime(item.created_at)} · {item.event_type.replace(/\./g, " ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${activeTab === "notes" ? "" : "hidden"} admin-card`}>
        <h2 className="admin-kicker">Notes & follow-up</h2>
        <label className="mt-4 block text-xs text-silver">Customer / job notes</label>
        <textarea
          className="admin-field mt-1 min-h-[5rem] w-full py-2"
          value={job.notes ?? ""}
          onChange={(e) => applyJobPatch({ notes: e.target.value || null })}
        />
        <label className="mt-3 block text-xs text-silver">Internal notes</label>
        <textarea
          className="admin-field mt-1 min-h-[4rem] w-full py-2"
          value={job.internal_notes ?? ""}
          onChange={(e) => applyJobPatch({ internal_notes: e.target.value || null })}
        />
        <label className="mt-3 block text-xs text-silver">Referral source</label>
        <input
          className="admin-field mt-1 w-full py-2"
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

      {activeTab === "notes" ? <JobFileUpload jobId={jobId} /> : null}
    </div>
  );
}
