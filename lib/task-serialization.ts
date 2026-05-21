import type {
  OperationalTaskActivity,
  OperationalTaskComment,
  OperationalTaskPriority,
  OperationalTaskRow,
  OperationalTaskStatus,
} from "@/lib/db-types";

export const TASK_STATUSES = ["todo", "scheduled", "in_progress", "blocked", "done", "cancelled"] as const;
export const TASK_PRIORITIES = ["urgent", "high", "normal", "low"] as const;

export function normalizeTaskStatus(value: unknown): OperationalTaskStatus {
  const s = String(value ?? "todo").toLowerCase();
  return TASK_STATUSES.includes(s as OperationalTaskStatus) ? (s as OperationalTaskStatus) : "todo";
}

export function normalizeTaskPriority(value: unknown): OperationalTaskPriority {
  const p = String(value ?? "normal").toLowerCase();
  return TASK_PRIORITIES.includes(p as OperationalTaskPriority) ? (p as OperationalTaskPriority) : "normal";
}

export function parseTaskPhotoUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => String(v ?? "").trim()).filter(Boolean).slice(0, 24);
}

export function parseTaskComments(raw: unknown): OperationalTaskComment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      const body = String(r.body ?? "").trim();
      if (!body) return null;
      return {
        id: String(r.id ?? crypto.randomUUID()),
        body,
        author: String(r.author ?? "Ops"),
        created_at: String(r.created_at ?? new Date().toISOString()),
      } satisfies OperationalTaskComment;
    })
    .filter((v): v is OperationalTaskComment => Boolean(v));
}

export function appendTaskComment(
  existing: unknown,
  body: string,
  author = "Ops",
): OperationalTaskComment[] {
  const trimmed = body.trim();
  const comments = parseTaskComments(existing);
  if (!trimmed) return comments;
  return [
    ...comments,
    { id: crypto.randomUUID(), body: trimmed, author, created_at: new Date().toISOString() },
  ];
}

export function parseTaskActivity(raw: unknown): OperationalTaskActivity[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      const label = String(r.label ?? "").trim();
      if (!label) return null;
      return {
        id: String(r.id ?? crypto.randomUUID()),
        type: String(r.type ?? "note"),
        label,
        created_at: String(r.created_at ?? new Date().toISOString()),
      } satisfies OperationalTaskActivity;
    })
    .filter((v): v is OperationalTaskActivity => Boolean(v));
}

export function appendTaskActivity(
  existing: unknown,
  type: string,
  label: string,
): OperationalTaskActivity[] {
  const trimmed = label.trim();
  const activity = parseTaskActivity(existing);
  if (!trimmed) return activity;
  return [
    { id: crypto.randomUUID(), type, label: trimmed, created_at: new Date().toISOString() },
    ...activity,
  ].slice(0, 40);
}

export function mapOperationalTaskRow(data: Record<string, unknown>): OperationalTaskRow {
  return {
    id: String(data.id),
    job_id: String(data.job_id),
    client_id: data.client_id ? String(data.client_id) : null,
    title: String(data.title ?? "Task"),
    status: normalizeTaskStatus(data.status),
    priority: normalizeTaskPriority(data.priority),
    priority_rank: Number(data.priority_rank) || 0,
    due_at: data.due_at != null ? String(data.due_at) : null,
    recurring_rule: data.recurring_rule != null ? String(data.recurring_rule) : null,
    assigned_crew_member_id: data.assigned_crew_member_id ? String(data.assigned_crew_member_id) : null,
    assigned_crew_name: data.assigned_crew_name != null ? String(data.assigned_crew_name) : null,
    completion_photo_urls: parseTaskPhotoUrls(data.completion_photo_urls),
    comments: parseTaskComments(data.comments),
    activity_log: parseTaskActivity(data.activity_log),
    completed_at: data.completed_at != null ? String(data.completed_at) : null,
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? data.created_at ?? ""),
  };
}
