import type { TaskCategory, TaskPriority, TaskStatus } from "@/lib/admin/task-constants";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus | "open" | "completed";
  priority: TaskPriority | "normal";
  due_date: string | null;
  category: string | null;
  job_id: string | null;
  client_id: string | null;
  invoice_id: string | null;
  expense_id: string | null;
  assigned_crew_ids: string[];
  assigned_crew_member_id: string | null;
  recurring_rule: "daily" | "weekly" | "monthly" | null;
  recurring_parent_id: string | null;
  sort_order: number;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
};

/** Defaults for bulk/workflow task creation (title comes from each item). */
export type TaskBulkDefaults = Omit<CreateTaskInput, "title"> & { title?: string };

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  category?: TaskCategory | string | null;
  job_id?: string | null;
  client_id?: string | null;
  invoice_id?: string | null;
  expense_id?: string | null;
  assigned_crew_member_id?: string | null;
  assigned_crew_ids?: string[];
  recurring_rule?: TaskRow["recurring_rule"];
};

export type CrewOption = { id: string; name: string };
