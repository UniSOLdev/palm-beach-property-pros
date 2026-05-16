import Link from "next/link";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/admin/task-badges";
import { loadTaskDashboardSummary } from "@/lib/tasks/queries";

export async function TasksDashboardWidget() {
  const summary = await loadTaskDashboardSummary();

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/[0.08] to-transparent p-6 ring-1 ring-white/[0.05]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Today&apos;s tasks</h2>
          <p className="mt-1 text-xs text-zinc-500">Action list — overdue, due today, and high priority.</p>
          {summary.using_fallback ? (
            <p className="mt-2 text-xs text-amber-200/70">Demo data — apply admin_tasks migration to persist.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/tasks/new"
            className="min-h-[40px] rounded-lg bg-sky-500/90 px-4 py-2 text-xs font-semibold text-sky-950 no-underline hover:bg-sky-400"
          >
            Add task
          </Link>
          <Link
            href="/admin/tasks"
            className="min-h-[40px] rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-100 no-underline hover:bg-white/5"
          >
            View all
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-200/80">Overdue</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{summary.overdue_count}</p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">Due today</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{summary.due_today_count}</p>
        </div>
        <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200/80">High priority</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{summary.high_priority_count}</p>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {summary.next_tasks.length === 0 ? (
          <li className="text-sm text-zinc-500">No open tasks — you&apos;re clear.</li>
        ) : (
          summary.next_tasks.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/tasks/${t.id}`}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 no-underline transition hover:border-sky-400/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium text-white">{t.title}</span>
                <div className="flex flex-wrap gap-1.5">
                  <TaskPriorityBadge priority={t.priority} />
                  <TaskStatusBadge status={t.status} />
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
