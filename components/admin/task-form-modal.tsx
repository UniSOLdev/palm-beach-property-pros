"use client";

import { useEffect, useState, useTransition } from "react";
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/admin/task-constants";
import { createTask, updateTask } from "@/lib/admin/actions/tasks";
import { normalizePriority, normalizeStatus } from "@/lib/admin/task-utils";
import type { CreateTaskInput, CrewOption, TaskRow } from "@/lib/admin/types";

export type TaskFormDefaults = Partial<CreateTaskInput> & {
  title?: string;
};

type TaskFormModalProps = {
  open: boolean;
  onClose: () => void;
  task?: TaskRow | null;
  defaults?: TaskFormDefaults;
  crew: CrewOption[];
  onSaved?: () => void;
};

export function TaskFormModal({
  open,
  onClose,
  task,
  defaults = {},
  crew,
  onSaved,
}: TaskFormModalProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [crewId, setCrewId] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStatus(normalizeStatus(task.status));
      setPriority(normalizePriority(task.priority));
      setDueDate(task.due_date ?? "");
      setCategory(task.category ?? "General");
      setCrewId(task.assigned_crew_member_id ?? "");
    } else {
      setTitle(defaults.title ?? "");
      setDescription(defaults.description ?? "");
      setStatus(defaults.status ?? "todo");
      setPriority(defaults.priority ?? "medium");
      setDueDate(defaults.due_date ?? "");
      setCategory(defaults.category ?? "General");
      setCrewId(defaults.assigned_crew_member_id ?? "");
    }
  }, [open, task, defaults]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <form
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-navy/10 bg-cream p-5 shadow-lift sm:rounded-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setError("");
          startTransition(async () => {
            try {
              const payload = {
                title: title.trim(),
                description: description.trim() || null,
                status,
                priority,
                due_date: dueDate || null,
                category: category as TaskCategory,
                job_id: defaults.job_id ?? task?.job_id ?? null,
                client_id: defaults.client_id ?? task?.client_id ?? null,
                invoice_id: defaults.invoice_id ?? task?.invoice_id ?? null,
                expense_id: defaults.expense_id ?? task?.expense_id ?? null,
                assigned_crew_member_id: crewId || null,
              };
              if (task) {
                await updateTask(task.id, payload);
              } else {
                await createTask(payload);
              }
              onSaved?.();
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Save failed");
            }
          });
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-navy">{task ? "Edit task" : "New task"}</h2>
          <button type="button" onClick={onClose} className="min-h-[44px] min-w-[44px] text-2xl text-charcoal/60">
            ×
          </button>
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        <div className="space-y-3">
          <label className="block text-sm font-medium text-navy">
            Title
            <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-navy">
            Notes
            <textarea
              className="admin-input min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-navy">
              Priority
              <select className="admin-input" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Status
              <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-navy">
            Due date
            <input type="date" className="admin-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-navy">
            Category
            <select className="admin-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          {crew.length > 0 ? (
            <label className="block text-sm font-medium text-navy">
              Assigned crew
              <select className="admin-input" value={crewId} onChange={(e) => setCrewId(e.target.value)}>
                <option value="">Unassigned</option>
                {crew.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="admin-btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="admin-btn flex-1">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
