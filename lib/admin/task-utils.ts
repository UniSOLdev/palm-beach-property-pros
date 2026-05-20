import { endOfWeek, parseISO, startOfDay } from "date-fns";
import type { TaskPriority, TaskStatus, TaskView } from "@/lib/admin/task-constants";
import type { TaskRow } from "@/lib/admin/types";

/** Normalize legacy DB values for display logic. */
export function normalizeStatus(status: string): TaskStatus {
  if (status === "open") return "todo";
  if (status === "completed") return "done";
  if (status === "todo" || status === "in_progress" || status === "done" || status === "cancelled") {
    return status;
  }
  return "todo";
}

export function normalizePriority(priority: string): TaskPriority {
  if (priority === "normal") return "medium";
  if (priority === "low" || priority === "medium" || priority === "high" || priority === "urgent") {
    return priority;
  }
  return "medium";
}

export function isTaskOpen(task: Pick<TaskRow, "status"> & { archived?: boolean }) {
  if (task.archived === true) return false;
  const s = normalizeStatus(task.status);
  return s !== "done" && s !== "cancelled";
}

export function isTaskDone(task: Pick<TaskRow, "status">) {
  return normalizeStatus(task.status) === "done";
}

export function isTaskOverdue(task: Pick<TaskRow, "due_date" | "status"> & { archived?: boolean }) {
  if (!isTaskOpen(task) || !task.due_date) return false;
  const today = startOfDay(new Date());
  const due = startOfDay(parseISO(task.due_date));
  return due.getTime() < today.getTime();
}

export function filterTasksByView(tasks: TaskRow[], view: TaskView) {
  const today = startOfDay(new Date());
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const active = tasks.filter((t) => !t.archived);

  if (view === "completed") {
    return active.filter((t) => isTaskDone(t));
  }

  const open = active.filter((t) => isTaskOpen(t));

  if (view === "urgent") {
    const p = (t: TaskRow) => normalizePriority(t.priority);
    return open.filter((t) => p(t) === "urgent" || p(t) === "high");
  }

  if (view === "overdue") {
    return open.filter((t) => isTaskOverdue(t));
  }

  if (view === "today") {
    return open.filter((t) => {
      if (!t.due_date) return false;
      const due = startOfDay(parseISO(t.due_date));
      return due.getTime() <= today.getTime();
    });
  }

  return open.filter((t) => {
    if (!t.due_date) return true;
    const due = parseISO(t.due_date);
    return due >= today && due <= weekEnd;
  });
}

export function statusLabel(status: string) {
  const s = normalizeStatus(status);
  if (s === "todo") return "To do";
  if (s === "in_progress") return "In progress";
  if (s === "done") return "Done";
  return "Cancelled";
}

export function priorityClass(priority: string) {
  const p = normalizePriority(priority);
  if (p === "urgent") return "bg-red-100 text-red-800";
  if (p === "high") return "bg-amber-100 text-amber-900";
  if (p === "low") return "bg-sky/60 text-navy";
  return "bg-neutral-100 text-charcoal";
}
