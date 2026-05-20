export const EXPENSE_CATEGORIES = [
  "Fuel",
  "Dump Fees",
  "Labor",
  "Equipment",
  "Supplies",
  "Chemicals",
  "Truck Rental",
  "Marketing",
  "Software",
  "Meals",
] as const;

export const PAYMENT_METHODS = ["Cash", "Zelle", "Card", "Check", "Venmo", "Other"] as const;

export const TASK_STATUSES = ["open", "in_progress", "completed", "cancelled"] as const;
export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export const ADMIN_NAV = [
  { href: "/admin", label: "Home", icon: "⌂" },
  { href: "/admin/tasks", label: "Tasks", icon: "✓" },
  { href: "/admin/jobs", label: "Jobs", icon: "📋" },
  { href: "/admin/expenses", label: "Expenses", icon: "💳" },
  { href: "/admin/invoices", label: "Invoices", icon: "📄" },
] as const;

export const ADMIN_MORE_NAV = [
  { href: "/admin/supplies", label: "Supplies" },
  { href: "/admin/crew", label: "Crew" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/website", label: "Site Studio" },
  { href: "/admin/website/media", label: "Media Library" },
] as const;

export const QUICK_ACTIONS = [
  { href: "/admin/invoices/new", label: "New Invoice", icon: "📄" },
  { href: "/admin/expenses?new=receipt", label: "Upload Receipt", icon: "🧾" },
  { href: "/admin/expenses?new=1", label: "Add Expense", icon: "💳" },
  { href: "/admin/tasks?new=1", label: "Add Task", icon: "✓" },
  { href: "/admin/jobs?note=1", label: "Job Note", icon: "📝" },
  { href: "/admin/jobs?photos=1", label: "Before/After", icon: "📷" },
] as const;
