export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  due_date: string | null;
  assigned_crew_ids: string[];
  job_id: string | null;
  recurring_rule: "daily" | "weekly" | "monthly" | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskView = "today" | "urgent" | "week" | "completed";
