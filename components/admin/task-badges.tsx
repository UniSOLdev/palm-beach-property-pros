import type { TaskPriority, TaskStatus } from "@/lib/tasks/constants";

export function TaskStatusBadge({ status }: { status: TaskStatus | string }) {
  const styles: Record<string, string> = {
    Open: "bg-sky-500/15 text-sky-100 ring-sky-400/30",
    "In Progress": "bg-blue-500/15 text-blue-100 ring-blue-400/30",
    Waiting: "bg-amber-500/15 text-amber-100 ring-amber-400/30",
    Completed: "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30",
    Cancelled: "bg-zinc-500/15 text-zinc-300 ring-zinc-400/30",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
        styles[status] ?? styles.Open
      }`}
    >
      {status}
    </span>
  );
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority | string }) {
  const styles: Record<string, string> = {
    Low: "bg-zinc-500/10 text-zinc-400",
    Normal: "bg-white/5 text-zinc-300",
    High: "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40",
    Urgent: "bg-red-500/20 text-red-100 ring-1 ring-red-400/40",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        styles[priority] ?? styles.Normal
      }`}
    >
      {priority}
    </span>
  );
}

export function TaskDueBadge({ dueDate, status }: { dueDate: string | null; status: string }) {
  if (!dueDate || status === "Completed" || status === "Cancelled") return null;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = dueDate < today;
  const todayDue = dueDate === today;
  if (overdue) {
    return (
      <span className="inline-flex rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-100 ring-1 ring-red-400/40">
        Overdue
      </span>
    );
  }
  if (todayDue) {
    return (
      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-100 ring-1 ring-amber-400/40">
        Due today
      </span>
    );
  }
  return null;
}
