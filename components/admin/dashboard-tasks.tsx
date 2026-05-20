"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import {
  filterTasksByView,
  isTaskOverdue,
  isTaskOpen,
  isTaskDone,
  priorityClass,
  normalizePriority,
} from "@/lib/admin/task-utils";
import type { CrewOption, TaskRow } from "@/lib/admin/types";

export function DashboardTasks({ tasks, crew }: { tasks: TaskRow[]; crew: CrewOption[] }) {
  const today = useMemo(() => filterTasksByView(tasks, "today"), [tasks]);
  const urgent = useMemo(() => filterTasksByView(tasks, "urgent"), [tasks]);
  const overdue = useMemo(() => tasks.filter((t) => isTaskOverdue(t)), [tasks]);
  const week = useMemo(() => filterTasksByView(tasks, "week"), [tasks]);
  const completed = useMemo(
    () => tasks.filter((t) => isTaskDone(t)).sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")),
    [tasks],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Operations tasks</h2>
        <TaskQuickAdd crew={crew} variant="primary" label="+ Quick task" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TaskStatCard label="Today" count={today.length} href="/admin/tasks" />
        <TaskStatCard label="Urgent" count={urgent.length} href="/admin/tasks" highlight />
        <TaskStatCard label="Overdue" count={overdue.length} href="/admin/tasks" warn={overdue.length > 0} />
        <TaskStatCard label="This week" count={week.length} href="/admin/tasks" />
      </div>

      <TaskSection title="Due today" tasks={today.slice(0, 6)} empty="Clear for today — nice work." />
      {overdue.length > 0 ? (
        <TaskSection title="Overdue" tasks={overdue.slice(0, 5)} tone="warn" />
      ) : null}
      <TaskSection title="Urgent" tasks={urgent.filter((t) => !isTaskOverdue(t)).slice(0, 5)} empty="No urgent items." />
      <TaskSection
        title="Recently completed"
        tasks={completed.slice(0, 5)}
        empty="Completed tasks will appear here."
        muted
      />

      <Link href="/admin/tasks" className="admin-btn block w-full text-center no-underline">
        Open full task board
      </Link>
    </section>
  );
}

function TaskStatCard({
  label,
  count,
  href,
  highlight,
  warn,
}: {
  label: string;
  count: number;
  href: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`admin-card block min-h-[72px] no-underline ${
        highlight ? "ring-2 ring-ocean/30" : warn ? "ring-2 ring-red-200" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{count}</p>
    </Link>
  );
}

function TaskSection({
  title,
  tasks,
  empty,
  tone,
  muted,
}: {
  title: string;
  tasks: TaskRow[];
  empty?: string;
  tone?: "warn";
  muted?: boolean;
}) {
  return (
    <div
      className={`admin-card ${tone === "warn" ? "border-red-200 bg-red-50/40" : ""} ${muted ? "opacity-85" : ""}`}
    >
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      <ul className="mt-3 space-y-2">
        {tasks.length === 0 ? (
          <li className="text-sm text-charcoal/60">{empty}</li>
        ) : (
          tasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium text-navy">{t.title}</span>
              <span className={`admin-chip shrink-0 ${priorityClass(t.priority)}`}>
                {normalizePriority(t.priority)}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
