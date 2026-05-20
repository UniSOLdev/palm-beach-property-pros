"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { TASK_VIEWS, type TaskView } from "@/lib/admin/task-constants";
import {
  archiveTask,
  moveTask,
  quickCompleteTask,
  reorderTasks,
} from "@/lib/admin/actions/tasks";
import {
  filterTasksByView,
  isTaskOpen,
  priorityClass,
  statusLabel,
  normalizePriority,
} from "@/lib/admin/task-utils";
import { TaskFormModal } from "@/components/admin/task-form-modal";
import type { CrewOption, TaskRow } from "@/lib/admin/types";

function SortableTask({
  task,
  onComplete,
  onEdit,
  onArchive,
  onMove,
  canMoveUp,
  canMoveDown,
  pending,
}: {
  task: TaskRow;
  onComplete: (id: string) => void;
  onEdit: (task: TaskRow) => void;
  onArchive: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} className="admin-card">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-1 min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-navy/15 text-lg"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <div className="min-w-0 flex-1">
          <button type="button" className="text-left" onClick={() => onEdit(task)}>
            <p className="font-semibold text-navy">{task.title}</p>
          </button>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className={`admin-chip ${priorityClass(task.priority)}`}>
              {normalizePriority(task.priority)}
            </span>
            {task.category ? <span className="admin-chip bg-sky/50 text-navy">{task.category}</span> : null}
            <span className="admin-chip bg-neutral-100 text-charcoal">{statusLabel(task.status)}</span>
          </div>
          {task.description ? <p className="mt-1 text-sm text-charcoal/75 line-clamp-2">{task.description}</p> : null}
          {task.due_date ? <p className="mt-1 text-xs font-medium text-charcoal/60">Due {task.due_date}</p> : null}
          {task.job_id ? <p className="mt-1 text-xs text-ocean">Linked to job</p> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {isTaskOpen(task) ? (
          <button
            type="button"
            onClick={() => onComplete(task.id)}
            disabled={pending}
            className="admin-btn-secondary min-h-[44px] flex-1 text-xs"
          >
            Done
          </button>
        ) : null}
        <button
          type="button"
          disabled={!canMoveUp || pending}
          onClick={() => onMove(task.id, "up")}
          className="admin-btn-secondary min-h-[44px] px-3 text-xs"
          aria-label="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={!canMoveDown || pending}
          onClick={() => onMove(task.id, "down")}
          className="admin-btn-secondary min-h-[44px] px-3 text-xs"
          aria-label="Move down"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => onArchive(task.id)}
          disabled={pending}
          className="admin-btn-secondary min-h-[44px] px-3 text-xs text-red-700"
        >
          Archive
        </button>
      </div>
    </li>
  );
}

export function TasksBoard({
  initialTasks,
  crew,
  openNewOnMount = false,
}: {
  initialTasks: TaskRow[];
  crew: CrewOption[];
  openNewOnMount?: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<TaskView>("today");
  const [tasks, setTasks] = useState(initialTasks);
  const [modalOpen, setModalOpen] = useState(openNewOnMount);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const visible = useMemo(() => filterTasksByView(tasks, view), [tasks, view]);
  const visibleIds = visible.map((t) => t.id);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visible.findIndex((t) => t.id === active.id);
    const newIndex = visible.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reorderedVisible = arrayMove(visible, oldIndex, newIndex);
    const visibleIdSet = new Set(visibleIds);
    const rest = tasks.filter((t) => !visibleIdSet.has(t.id));
    setTasks([...reorderedVisible, ...rest]);
    startTransition(async () => {
      await reorderTasks(reorderedVisible.map((t) => t.id));
    });
  }

  return (
    <div className="space-y-4 pb-8">
      {actionError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p> : null}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TASK_VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-semibold ${
              view === v.key ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-navy/10"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <button type="button" onClick={() => { setEditing(null); setModalOpen(true); }} className="admin-btn w-full">
        + New task
      </button>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3">
            {visible.length === 0 ? (
              <li className="admin-card text-center text-sm text-charcoal/60">No tasks in this view.</li>
            ) : (
              visible.map((task, index) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  pending={pending}
                  canMoveUp={index > 0}
                  canMoveDown={index < visible.length - 1}
                  onComplete={(id) =>
                    startTransition(async () => {
                      setActionError("");
                      try {
                        await quickCompleteTask(id);
                        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
                        router.refresh();
                      } catch (err) {
                        setActionError(err instanceof Error ? err.message : "Could not complete task");
                      }
                    })
                  }
                  onEdit={(t) => {
                    setEditing(t);
                    setModalOpen(true);
                  }}
                  onArchive={(id) =>
                    startTransition(async () => {
                      await archiveTask(id);
                      setTasks((prev) => prev.filter((t) => t.id !== id));
                      router.refresh();
                    })
                  }
                  onMove={(id, dir) =>
                    startTransition(async () => {
                      await moveTask(id, dir, visibleIds);
                      router.refresh();
                    })
                  }
                />
              ))
            )}
          </ul>
        </SortableContext>
      </DndContext>

      <TaskFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        task={editing}
        crew={crew}
        onSaved={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
