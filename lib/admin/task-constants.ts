export const TASK_CATEGORIES = [
  "Job Follow-Up",
  "Quote Follow-Up",
  "Invoice Follow-Up",
  "Client Communication",
  "Expense/Receipt",
  "Website Update",
  "Photo Upload",
  "Supply Restock",
  "Crew/Admin",
  "Marketing",
  "LLC/Business Setup",
  "General",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "done", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_VIEWS = [
  { key: "today", label: "Today" },
  { key: "urgent", label: "Urgent" },
  { key: "overdue", label: "Overdue" },
  { key: "week", label: "This Week" },
  { key: "completed", label: "Completed" },
] as const;

export type TaskView = (typeof TASK_VIEWS)[number]["key"];

export const JOB_CHECKLIST_ITEMS: {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
}[] = [
  { title: "Confirm scope in writing", category: "Job Follow-Up", priority: "high" },
  { title: "Upload before photos", category: "Photo Upload", priority: "high" },
  { title: "Track receipts and job expenses", category: "Expense/Receipt", priority: "medium" },
  { title: "Upload after photos", category: "Photo Upload", priority: "high" },
  { title: "Create and send invoice", category: "Invoice Follow-Up", priority: "high" },
  { title: "Confirm payment received", category: "Invoice Follow-Up", priority: "medium" },
  { title: "Ask for review or testimonial", category: "Client Communication", priority: "medium" },
  {
    title: "Add best photos to website gallery or case study",
    category: "Website Update",
    priority: "low",
  },
];

export const WORKFLOW_SHORTCUTS = {
  job: [
    { title: "Upload before photos", category: "Photo Upload" as TaskCategory },
    { title: "Confirm scope in writing", category: "Job Follow-Up" as TaskCategory },
    { title: "Track expenses and receipts", category: "Expense/Receipt" as TaskCategory },
    { title: "Upload after photos", category: "Photo Upload" as TaskCategory },
    { title: "Create and send invoice", category: "Invoice Follow-Up" as TaskCategory },
    { title: "Ask for review or testimonial", category: "Client Communication" as TaskCategory },
  ],
  invoice: [
    { title: "Follow up on unpaid invoice", category: "Invoice Follow-Up" as TaskCategory },
    { title: "Confirm payment received", category: "Invoice Follow-Up" as TaskCategory },
  ],
  expense: [
    { title: "Attach receipt image", category: "Expense/Receipt" as TaskCategory },
    { title: "Link expense to job if applicable", category: "Expense/Receipt" as TaskCategory },
  ],
  website: [
    { title: "Add photos to gallery or case study", category: "Website Update" as TaskCategory },
  ],
} as const;
