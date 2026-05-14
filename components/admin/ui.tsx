import type { ReactNode } from "react";

const styles: Record<string, string> = {
  Lead: "bg-slate-100 text-slate-800 ring-slate-200",
  Quoted: "bg-sky text-navy ring-sky",
  Approved: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  Scheduled: "bg-blue-50 text-blue-900 ring-blue-200",
  "In Progress": "bg-amber-50 text-amber-900 ring-amber-200",
  Completed: "bg-teal-50 text-teal-900 ring-teal-200",
  Paid: "bg-leaf/15 text-navy ring-leaf/30",
  Cancelled: "bg-rose-50 text-rose-900 ring-rose-200",
  Draft: "bg-slate-100 text-slate-800 ring-slate-200",
  Sent: "bg-sky text-navy ring-sky",
  Declined: "bg-rose-50 text-rose-900 ring-rose-200",
  "Converted to Invoice": "bg-indigo-50 text-indigo-900 ring-indigo-200",
  Unpaid: "bg-amber-50 text-amber-900 ring-amber-200",
  "Partially Paid": "bg-orange-50 text-orange-900 ring-orange-200",
  Overdue: "bg-rose-50 text-rose-900 ring-rose-200",
  "Not sent": "bg-slate-100 text-slate-800 ring-slate-200",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = styles[status] ?? "bg-slate-100 text-slate-800 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-charcoal/70">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-navy/10 bg-white p-5 shadow-card ${className}`}
    >
      {title ? <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-navy/70">{title}</h2> : null}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-card md:p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">{label}</div>
      <div className="mt-2 text-2xl font-bold text-navy">{value}</div>
      {hint ? <div className="mt-1 text-xs text-charcoal/55">{hint}</div> : null}
    </div>
  );
}

export function ProfitToneBadge({ tone, children }: { tone: "strong" | "thin" | "loss"; children: ReactNode }) {
  const cls =
    tone === "strong"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
      : tone === "thin"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : "bg-rose-50 text-rose-900 ring-rose-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {children}
    </span>
  );
}

export function ExpenseCategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex max-w-[10rem] truncate rounded-full bg-sky/40 px-2 py-0.5 text-[11px] font-semibold text-navy ring-1 ring-navy/10">
      {category}
    </span>
  );
}

export function ExpenseTypeBadge({ type }: { type: string }) {
  const subtle =
    type === "Job-specific"
      ? "bg-blue-50 text-blue-900 ring-blue-200"
      : type === "Reusable supplies"
        ? "bg-teal-50 text-teal-900 ring-teal-200"
        : type === "Equipment investment"
          ? "bg-violet-50 text-violet-900 ring-violet-200"
          : "bg-slate-100 text-slate-800 ring-slate-200";
  return (
    <span className={`inline-flex max-w-[11rem] truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${subtle}`}>
      {type}
    </span>
  );
}

export function MiniProgressBar({ fraction }: { fraction: number }) {
  const pct = Math.max(0, Math.min(100, fraction * 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-sky/50">
      <div className="h-full rounded-full bg-ocean" style={{ width: `${pct}%` }} />
    </div>
  );
}
