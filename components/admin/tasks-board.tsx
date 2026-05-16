"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskCard } from "@/components/admin/task-card";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks/constants";
import type { AdminTaskWithRelations } from "@/lib/tasks/types";

type DueFilter = "all" | "today" | "week" | "overdue" | "upcoming" | "completed";

export function TasksBoard({ initialTasks, usingFallback }: { initialTasks: AdminTaskWithRelations[]; usingFallback: boolean }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [due, setDue] = useState<DueFilter>("all");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (category) params.set("category", category);
      if (due !== "all") params.set("due", due);
      const res = await fetch(`/api/admin/tasks?${params}`);
      const data = await res.json();
      if (res.ok) setTasks(data.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }, [q, status, priority, category, due]);

  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [refresh]);

  const today = new Date().toISOString().slice(0, 10);

  const buckets = useMemo(() => {
    const open = tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status));
    const completed = tasks.filter((t) => t.status === "Completed");
    return {
      overdue: open.filter((t) => t.due_date && t.due_date < today),
      today: open.filter((t) => t.due_date === today),
      upcoming: open.filter((t) => t.due_date && t.due_date > today),
      waiting: open.filter((t) => !t.due_date || (t.due_date >= today && t.status === "Waiting")),
      completed,
    };
  }, [tasks, today]);

  return (
    <div className="pb-24 md:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500">Daily action list — follow-ups, crew, admin, and ops.</p>
          {usingFallback ? (
            <p className="mt-2 text-xs text-amber-200/80">Showing demo tasks — run the admin_tasks migration in Supabase to persist.</p>
          ) : null}
        </div>
        <Link
          href="/admin/tasks/new"
          className="min-h-[44px] rounded-xl bg-sky-500/90 px-5 py-2.5 text-sm font-semibold text-sky-950 no-underline shadow-lg shadow-sky-900/25 hover:bg-sky-400"
        >
          Add task
        </Link>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <input
          type="search"
          placeholder="Search tasks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-sky-400/40"
        />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={due}
            onChange={(e) => setDue(e.target.value as DueFilter)}
            className="min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
          >
            <option value="all">All dates</option>
            <option value="today">Due today</option>
            <option value="week">This week</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
          >
            <option value="">All statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
          >
            <option value="">All priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
          >
            <option value="">All categories</option>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {loading ? <p className="text-xs text-zinc-500">Updating…</p> : null}
      </div>

      {due === "all" && !status && !priority && !category && !q ? (
        <div className="mt-10 space-y-10">
          <TaskSection title="Overdue" count={buckets.overdue.length} tasks={buckets.overdue} empty="Nothing overdue." />
          <TaskSection title="Due today" count={buckets.today.length} tasks={buckets.today} empty="Clear for today — add a task if needed." />
          <TaskSection title="Upcoming" count={buckets.upcoming.length} tasks={buckets.upcoming} empty="No upcoming dated tasks." />
          <TaskSection title="Completed" count={buckets.completed.length} tasks={buckets.completed} empty="No completed tasks yet." />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {tasks.length === 0 ? (
            <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-500">
              No tasks match your filters.
            </li>
          ) : (
            tasks.map((t) => (
              <li key={t.id}>
                <TaskCard task={t} />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function TaskSection({
  title,
  count,
  tasks,
  empty,
}: {
  title: string;
  count: number;
  tasks: AdminTaskWithRelations[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/90">
        {title} <span className="text-zinc-600">({count})</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {tasks.map((t) => (
            <li key={t.id}>
              <TaskCard task={t} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
