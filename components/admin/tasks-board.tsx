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
import { endOfWeek, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { useMemo, useState, useTransition } from "react";
import {
  createTask,
  quickCompleteTask,
  reorderTasks,
} from "@/lib/admin/actions/tasks";
import type { TaskRow, TaskView } from "@/lib/admin/types";

const VIEWS: { key: TaskView; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "urgent", label: "Urgent" },
  { key: "week", label: "This Week" },
  { key: "completed", label: "Completed" },
];

function priorityClass(priority: TaskRow["priority"]) {
  if (priority === "urgent") return "bg-red-100 text-red-800";
  if (priority === "high") return "bg-amber-100 text-amber-900";
  if (priority === "low") return "bg-sky/60 text-navy";
  return "bg-neutral-100 text-charcoal";
}

function filterTasks(tasks: TaskRow[], view: TaskView) {
  const today = startOfDay(new Date());
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  if (view === "completed") return tasks.filter((t) => t.status === "completed");
  const open = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");

  if (view === "urgent") {
    return open.filter((t) => t.priority === "urgent" || t.priority === "high");
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
    return isWithinInterval(due, { start: today, end: weekEnd });
  });
}

function SortableTask({
  task,
  onComplete,
}: {
  task: TaskRow;
  onComplete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} className="admin-card flex items-start gap-3">
      <button
        type="button"
        className="mt-1 min-h-[44px] min-w-[44px] rounded-xl border border-navy/15 text-lg"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-navy">{task.title}</p>
          <span className={`admin-chip ${priorityClass(task.priority)}`}>{task.priority}</span>
          {task.recurring_rule ? (
            <span className="admin-chip bg-ocean/10 text-ocean">↻ {task.recurring_rule}</span>
          ) : null}
        </div>
        {task.description ? <p className="mt-1 text-sm text-charcoal/75">{task.description}</p> : null}
        {task.due_date ? (
          <p className="mt-2 text-xs font-medium text-charcoal/60">Due {task.due_date}</p>
        ) : null}
      </div>
      {task.status !== "completed" ? (
        <button
          type="button"
          onClick={() => onComplete(task.id)}
          className="admin-btn-secondary min-h-[44px] px-3 text-xs"
        >
          Done
        </button>
      ) : null}
    </li>
  );
}

export function TasksBoard({ initialTasks }: { initialTasks: TaskRow[] }) {
  const [view, setView] = useState<TaskView>("today");
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskRow["priority"]>("normal");
  const [dueDate, setDueDate] = useState("");
  const [recurring, setRecurring] = useState<TaskRow["recurring_rule"]>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const visible = useMemo(() => filterTasks(tasks, view), [tasks, view]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visible.findIndex((t) => t.id === active.id);
    const newIndex = visible.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reorderedVisible = arrayMove(visible, oldIndex, newIndex);
    const visibleIds = new Set(visible.map((t) => t.id));
    const rest = tasks.filter((t) => !visibleIds.has(t.id));
    const next = [...reorderedVisible, ...rest];
    setTasks(next);
    startTransition(async () => {
      await reorderTasks(reorderedVisible.map((t) => t.id));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {VIEWS.map((v) => (
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

      <form
        className="admin-card space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          startTransition(async () => {
            await createTask({
              title: title.trim(),
              priority,
              due_date: dueDate || null,
              recurring_rule: recurring,
            });
            setTitle("");
            setDueDate("");
            setRecurring(null);
            window.location.reload();
          });
        }}
      >
        <h2 className="text-lg font-bold text-navy">New task</h2>
        <input
          className="admin-input"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-navy">
            Priority
            <select
              className="admin-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskRow["priority"])}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="text-sm font-medium text-navy">
            Due date
            <input
              type="date"
              className="admin-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>
        <label className="text-sm font-medium text-navy">
          Recurring
          <select
            className="admin-input"
            value={recurring ?? ""}
            onChange={(e) =>
              setRecurring((e.target.value || null) as TaskRow["recurring_rule"])
            }
          >
            <option value="">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <button type="submit" disabled={pending} className="admin-btn w-full">
          Add task
        </button>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3">
            {visible.length === 0 ? (
              <li className="admin-card text-center text-sm text-charcoal/60">No tasks in this view.</li>
            ) : (
              visible.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onComplete={(id) =>
                    startTransition(async () => {
                      await quickCompleteTask(id);
                      setTasks((prev) =>
                        prev.map((t) => (t.id === id ? { ...t, status: "completed" } : t)),
                      );
                    })
                  }
                />
              ))
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
