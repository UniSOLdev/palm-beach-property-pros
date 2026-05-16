import type { TaskCategory, TaskPriority, TaskStatus } from "@/lib/tasks/constants";

export type AdminTaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string | null;
  due_date: string | null;
  due_time: string | null;
  assigned_crew_member_id: string | null;
  client_id: string | null;
  job_id: string | null;
  quote_id: string | null;
  invoice_id: string | null;
  internal_notes: string | null;
  completed_at: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminTaskWithRelations = AdminTaskRow & {
  crew_member?: { id: string; full_name: string } | null;
  client?: { id: string; full_name: string } | null;
  job?: { id: string; title: string } | null;
  quote?: { id: string; reference_code: string | null } | null;
  invoice?: { id: string; title: string | null; public_token: string } | null;
};

export type TaskDashboardSummary = {
  overdue_count: number;
  due_today_count: number;
  high_priority_count: number;
  next_tasks: AdminTaskRow[];
  using_fallback: boolean;
};

export type TaskListFilters = {
  q?: string;
  status?: string;
  priority?: string;
  category?: string;
  assigned_crew_member_id?: string;
  client_id?: string;
  job_id?: string;
  due?: "today" | "week" | "overdue" | "upcoming" | "completed" | "all";
  include_archived?: boolean;
};
