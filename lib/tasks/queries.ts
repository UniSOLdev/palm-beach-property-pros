import { OPEN_TASK_STATUSES } from "@/lib/tasks/constants";
import { FALLBACK_ADMIN_TASKS } from "@/lib/tasks/defaults";
import type {
  AdminTaskRow,
  AdminTaskWithRelations,
  TaskDashboardSummary,
  TaskListFilters,
} from "@/lib/tasks/types";
import { createServiceSupabase } from "@/lib/supabase/service";

const TASK_SELECT = `
  *,
  crew_member:crew_members(id, full_name),
  client:clients(id, full_name),
  job:jobs(id, title),
  quote:quotes(id, reference_code),
  invoice:invoices(id, title, public_token)
`;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekEndIsoDate(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function filterFallback(tasks: AdminTaskRow[], filters: TaskListFilters): AdminTaskRow[] {
  const today = todayIsoDate();
  const weekEnd = weekEndIsoDate();
  let list = tasks.filter((t) => (filters.include_archived ? true : !t.archived));

  if (filters.status) list = list.filter((t) => t.status === filters.status);
  if (filters.priority) list = list.filter((t) => t.priority === filters.priority);
  if (filters.category) list = list.filter((t) => t.category === filters.category);
  if (filters.client_id) list = list.filter((t) => t.client_id === filters.client_id);
  if (filters.job_id) list = list.filter((t) => t.job_id === filters.job_id);
  if (filters.assigned_crew_member_id) {
    list = list.filter((t) => t.assigned_crew_member_id === filters.assigned_crew_member_id);
  }

  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        (t.category?.toLowerCase().includes(q) ?? false),
    );
  }

  switch (filters.due) {
    case "today":
      list = list.filter(
        (t) => t.due_date === today && OPEN_TASK_STATUSES.includes(t.status as (typeof OPEN_TASK_STATUSES)[number]),
      );
      break;
    case "overdue":
      list = list.filter(
        (t) =>
          t.due_date &&
          t.due_date < today &&
          OPEN_TASK_STATUSES.includes(t.status as (typeof OPEN_TASK_STATUSES)[number]),
      );
      break;
    case "week":
      list = list.filter(
        (t) =>
          t.due_date &&
          t.due_date >= today &&
          t.due_date <= weekEnd &&
          OPEN_TASK_STATUSES.includes(t.status as (typeof OPEN_TASK_STATUSES)[number]),
      );
      break;
    case "upcoming":
      list = list.filter(
        (t) =>
          t.due_date &&
          t.due_date > today &&
          OPEN_TASK_STATUSES.includes(t.status as (typeof OPEN_TASK_STATUSES)[number]),
      );
      break;
    case "completed":
      list = list.filter((t) => t.status === "Completed");
      break;
    default:
      break;
  }

  return list.sort((a, b) => {
    const da = a.due_date ?? "9999-12-31";
    const db = b.due_date ?? "9999-12-31";
    if (da !== db) return da.localeCompare(db);
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export async function listTasks(
  filters: TaskListFilters = {},
): Promise<{ tasks: AdminTaskWithRelations[]; using_fallback: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      tasks: filterFallback(FALLBACK_ADMIN_TASKS, filters) as AdminTaskWithRelations[],
      using_fallback: true,
    };
  }

  try {
    const supabase = createServiceSupabase();
    const today = todayIsoDate();
    const weekEnd = weekEndIsoDate();

    let query = supabase.from("admin_tasks").select(TASK_SELECT).order("due_date", { ascending: true, nullsFirst: false });

    if (!filters.include_archived) query = query.eq("archived", false);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.priority) query = query.eq("priority", filters.priority);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.client_id) query = query.eq("client_id", filters.client_id);
    if (filters.job_id) query = query.eq("job_id", filters.job_id);
    if (filters.assigned_crew_member_id) {
      query = query.eq("assigned_crew_member_id", filters.assigned_crew_member_id);
    }

    if (filters.q) {
      const escaped = filters.q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    }

    switch (filters.due) {
      case "today":
        query = query.eq("due_date", today).in("status", OPEN_TASK_STATUSES);
        break;
      case "overdue":
        query = query.lt("due_date", today).in("status", OPEN_TASK_STATUSES);
        break;
      case "week":
        query = query.gte("due_date", today).lte("due_date", weekEnd).in("status", OPEN_TASK_STATUSES);
        break;
      case "upcoming":
        query = query.gt("due_date", today).in("status", OPEN_TASK_STATUSES);
        break;
      case "completed":
        query = query.eq("status", "Completed");
        break;
      default:
        break;
    }

    const { data, error } = await query.limit(300);
    if (error) throw error;
    return { tasks: (data ?? []) as AdminTaskWithRelations[], using_fallback: false };
  } catch {
    return {
      tasks: filterFallback(FALLBACK_ADMIN_TASKS, filters) as AdminTaskWithRelations[],
      using_fallback: true,
    };
  }
}

export async function getTaskById(id: string): Promise<{
  task: AdminTaskWithRelations | null;
  using_fallback: boolean;
}> {
  if (!isSupabaseConfigured() || id.startsWith("demo-")) {
    const task = FALLBACK_ADMIN_TASKS.find((t) => t.id === id) ?? null;
    return { task: task as AdminTaskWithRelations | null, using_fallback: true };
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("admin_tasks").select(TASK_SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    return { task: (data as AdminTaskWithRelations | null) ?? null, using_fallback: false };
  } catch {
    const task = FALLBACK_ADMIN_TASKS.find((t) => t.id === id) ?? null;
    return { task: task as AdminTaskWithRelations | null, using_fallback: true };
  }
}

export async function loadTaskDashboardSummary(): Promise<TaskDashboardSummary> {
  const { tasks, using_fallback } = await listTasks({ due: "all" });
  const today = todayIsoDate();
  const open = tasks.filter((t) => !t.archived && OPEN_TASK_STATUSES.includes(t.status as (typeof OPEN_TASK_STATUSES)[number]));

  const overdue_count = open.filter((t) => t.due_date && t.due_date < today).length;
  const due_today_count = open.filter((t) => t.due_date === today).length;
  const high_priority_count = open.filter((t) => t.priority === "High" || t.priority === "Urgent").length;

  const priorityRank = (p: string) => ({ Urgent: 0, High: 1, Normal: 2, Low: 3 })[p] ?? 4;
  const next_tasks = [...open]
    .sort((a, b) => {
      const pa = priorityRank(a.priority);
      const pb = priorityRank(b.priority);
      if (pa !== pb) return pa - pb;
      const da = a.due_date ?? "9999-12-31";
      const db = b.due_date ?? "9999-12-31";
      return da.localeCompare(db);
    })
    .slice(0, 5) as AdminTaskRow[];

  return { overdue_count, due_today_count, high_priority_count, next_tasks, using_fallback };
}

export async function listTasksForRelation(filters: {
  client_id?: string;
  job_id?: string;
  quote_id?: string;
  invoice_id?: string;
}): Promise<AdminTaskWithRelations[]> {
  if (!isSupabaseConfigured()) {
    let list = FALLBACK_ADMIN_TASKS.filter((t) => !t.archived);
    if (filters.client_id) list = list.filter((t) => t.client_id === filters.client_id);
    if (filters.job_id) list = list.filter((t) => t.job_id === filters.job_id);
    return list as AdminTaskWithRelations[];
  }

  try {
    const supabase = createServiceSupabase();
    let query = supabase
      .from("admin_tasks")
      .select(TASK_SELECT)
      .eq("archived", false)
      .order("due_date", { ascending: true })
      .limit(20);

    if (filters.client_id) query = query.eq("client_id", filters.client_id);
    if (filters.job_id) query = query.eq("job_id", filters.job_id);
    if (filters.quote_id) query = query.eq("quote_id", filters.quote_id);
    if (filters.invoice_id) query = query.eq("invoice_id", filters.invoice_id);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as AdminTaskWithRelations[];
  } catch {
    return [];
  }
}
