export const TASK_STATUSES = ["Open", "In Progress", "Waiting", "Completed", "Cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_CATEGORIES = [
  "Job Follow-Up",
  "Client Follow-Up",
  "Quote Follow-Up",
  "Invoice Follow-Up",
  "Cleaning Job",
  "Detailing Job",
  "Pressure Washing Job",
  "Window Cleaning Job",
  "Supplies / Inventory",
  "Equipment",
  "Marketing",
  "Admin",
  "Crew",
  "Personal / Owner",
  "Other",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const OPEN_TASK_STATUSES: TaskStatus[] = ["Open", "In Progress", "Waiting"];
