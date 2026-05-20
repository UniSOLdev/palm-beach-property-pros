"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { WORKFLOW_SHORTCUTS } from "@/lib/admin/task-constants";
import { createJobChecklist, createTasksBulk, quickCompleteTask } from "@/lib/admin/actions/tasks";
import { isTaskDone, isTaskOpen, priorityClass, statusLabel, normalizePriority } from "@/lib/admin/task-utils";
import { TaskFormModal } from "@/components/admin/task-form-modal";
import type { CrewOption, TaskRow } from "@/lib/admin/types";

export function TaskJobPanel({
  jobId,
  clientId,
  tasks,
  crew,
}: {
  jobId: string;
  clientId: string;
  tasks: TaskRow[];
  crew: CrewOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaults, setModalDefaults] = useState<{ title?: string; category?: string }>({});

  const open = useMemo(() => tasks.filter((t) => isTaskOpen(t)), [tasks]);
  const done = useMemo(() => tasks.filter((t) => isTaskDone(t)), [tasks]);

  function openTaskForm(preset?: { title?: string; category?: string }) {
    setModalDefaults(preset ?? {});
    setModalOpen(true);
  }

  return (
    <section className="admin-card space-y-4" id="job-tasks">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-navy">Job tasks</h2>
          <p className="text-xs text-charcoal/60">
            {open.length} open · {done.length} done
          </p>
        </div>
        <button type="button" onClick={() => openTaskForm()} className="admin-btn-secondary min-h-[44px] px-3 text-xs">
          + Task
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="admin-btn min-h-[44px] flex-1 text-xs sm:flex-none"
          onClick={() =>
            startTransition(async () => {
              await createJobChecklist(jobId, clientId);
              router.refresh();
            })
          }
        >
          Create job checklist
        </button>
      </div>

      <details className="rounded-xl border border-navy/10 bg-cream/40 px-3 py-2">
        <summary className="min-h-[44px] cursor-pointer text-sm font-semibold text-navy">
          Quick shortcuts
        </summary>
        <ul className="mt-2 space-y-2">
          {WORKFLOW_SHORTCUTS.job.map((item) => (
            <li key={item.title}>
              <button
                type="button"
                className="w-full rounded-lg bg-white px-3 py-2 text-left text-xs font-medium text-navy ring-1 ring-navy/10"
                onClick={() =>
                  startTransition(async () => {
                    await createTasksBulk([item], {
                      job_id: jobId,
                      client_id: clientId,
                      category: item.category,
                    });
                    router.refresh();
                  })
                }
              >
                + {item.title}
              </button>
            </li>
          ))}
        </ul>
      </details>

      <TaskList
        title="Open"
        tasks={open}
        pending={pending}
        onComplete={(id) =>
          startTransition(async () => {
            await quickCompleteTask(id);
            router.refresh();
          })
        }
        empty="No open tasks for this job."
      />
      {done.length > 0 ? (
        <TaskList title="Completed" tasks={done} pending={pending} empty="" muted />
      ) : null}

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaults={{
          job_id: jobId,
          client_id: clientId,
          title: modalDefaults.title,
          category: modalDefaults.category ?? "Job Follow-Up",
        }}
        crew={crew}
        onSaved={() => router.refresh()}
      />
    </section>
  );
}

function TaskList({
  title,
  tasks,
  pending,
  onComplete,
  empty,
  muted,
}: {
  title: string;
  tasks: TaskRow[];
  pending: boolean;
  onComplete?: (id: string) => void;
  empty: string;
  muted?: boolean;
}) {
  if (tasks.length === 0 && empty) {
    return <p className="text-sm text-charcoal/60">{empty}</p>;
  }
  if (tasks.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/50">{title}</p>
      <ul className={`mt-2 space-y-2 ${muted ? "opacity-70" : ""}`}>
        {tasks.map((t) => (
          <li key={t.id} className="flex items-start gap-2 rounded-xl border border-navy/10 bg-white px-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">{t.title}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className={`admin-chip ${priorityClass(t.priority)}`}>
                  {normalizePriority(t.priority)}
                </span>
                {t.category ? (
                  <span className="admin-chip bg-sky/50 text-navy">{t.category}</span>
                ) : null}
                <span className="admin-chip bg-neutral-100 text-charcoal">{statusLabel(t.status)}</span>
              </div>
              {t.due_date ? <p className="mt-1 text-xs text-charcoal/55">Due {t.due_date}</p> : null}
            </div>
            {onComplete && isTaskOpen(t) ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onComplete(t.id)}
                className="admin-btn-secondary min-h-[44px] shrink-0 px-3 text-xs"
              >
                Done
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
