import Link from "next/link";
import { TaskDueBadge, TaskPriorityBadge, TaskStatusBadge } from "@/components/admin/task-badges";
import type { AdminTaskWithRelations } from "@/lib/tasks/types";

function formatDue(dueDate: string | null, dueTime: string | null): string {
  if (!dueDate) return "No due date";
  const d = new Date(`${dueDate}T12:00:00`);
  const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return dueTime ? `${label} · ${dueTime}` : label;
}

type Props = {
  task: AdminTaskWithRelations;
  compact?: boolean;
};

export function TaskCard({ task, compact }: Props) {
  return (
    <Link
      href={`/admin/tasks/${task.id}`}
      className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 no-underline ring-1 ring-white/[0.05] transition hover:border-sky-400/30 hover:bg-white/[0.06]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className={`font-semibold text-white ${compact ? "text-sm" : "text-base"}`}>{task.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
          <TaskDueBadge dueDate={task.due_date} status={task.status} />
        </div>
      </div>
      {!compact && task.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{task.description}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
        {task.category ? <span>{task.category}</span> : null}
        <span>{formatDue(task.due_date, task.due_time)}</span>
        {task.crew_member?.full_name ? <span>→ {task.crew_member.full_name}</span> : null}
        {task.client?.full_name ? <span>· {task.client.full_name}</span> : null}
      </div>
    </Link>
  );
}
