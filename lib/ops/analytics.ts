import { fetchRecentOperationalActivity } from "@/lib/ops/activity";
import { createServiceSupabase } from "@/lib/supabase/service";

export type OpsActivityItem = {
  id: string;
  type: "job" | "invoice" | "expense" | "task";
  label: string;
  meta: string;
  href: string;
  occurred_at: string;
};

export type OpsUpcomingJob = {
  id: string;
  title: string;
  job_number: string | null;
  status: string;
  property_address: string | null;
  updated_at: string;
};

export type OpsDashboardMetrics = {
  clients: number;
  jobs: number;
  invoices: number;
  active_jobs: number;
  invoice_revenue_cents: number;
  paid_invoice_cents: number;
  open_invoice_cents: number;
  job_revenue_cents: number;
  expense_cents: number;
  expense_count: number;
  profit_signal_cents: number;
  profit_margin_percent: number;
  crew_active: number;
  low_stock: number;
  open_tasks: number;
  blocked_tasks: number;
  tasks_due_today: number;
  upcoming_jobs: OpsUpcomingJob[];
  recent_activity: OpsActivityItem[];
};

function cents(value: unknown): number {
  return Math.round(Number(value) || 0);
}

function isOpenInvoiceStatus(status: unknown): boolean {
  const s = String(status ?? "draft").toLowerCase();
  return !["paid", "void", "cancelled", "canceled", "refunded"].includes(s);
}

function isPaidInvoiceStatus(status: unknown): boolean {
  return String(status ?? "").toLowerCase() === "paid";
}

function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export async function loadOpsDashboardMetrics(): Promise<OpsDashboardMetrics> {
  const supabase = createServiceSupabase();

  const [clientsRes, jobsRes, invoicesRes, crewRes, expenseTotalsRes, expenseRecentRes, inventoryRes, tasksRes, activityRows] =
    await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("jobs").select("id, title, job_number, status, revenue_cents, property_address, created_at, updated_at"),
      supabase.from("invoices").select("id, public_token, title, total_cents, status, created_at, updated_at"),
      supabase.from("crew_members").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("expense_totals_v").select("expense_count, total_cents").maybeSingle(),
      supabase.from("expenses").select("id, vendor, category, amount_cents, created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("inventory_items").select("quantity, reorder_level"),
      supabase.from("operational_tasks").select("id, job_id, title, status, priority, due_at, updated_at"),
      fetchRecentOperationalActivity(supabase, 12).catch(() => []),
    ]);

  const jobs = jobsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const expenses = expenseRecentRes.data ?? [];

  const active_jobs = jobs.filter((j) => !["completed", "cancelled", "archived"].includes(j.status ?? "")).length;
  const job_revenue_cents = jobs.reduce((s, j) => s + cents(j.revenue_cents), 0);
  const invoice_revenue_cents = invoices.reduce((s, i) => s + cents(i.total_cents), 0);
  const paid_invoice_cents = invoices.filter((i) => isPaidInvoiceStatus(i.status)).reduce((s, i) => s + cents(i.total_cents), 0);
  const open_invoice_cents = invoices.filter((i) => isOpenInvoiceStatus(i.status)).reduce((s, i) => s + cents(i.total_cents), 0);
  const expense_cents = Number((expenseTotalsRes.data as { total_cents?: number } | null)?.total_cents ?? 0);
  const expense_count = Number((expenseTotalsRes.data as { expense_count?: number } | null)?.expense_count ?? 0);
  const profit_signal_cents = paid_invoice_cents - expense_cents;
  const profit_margin_percent = paid_invoice_cents > 0 ? Math.round((profit_signal_cents / paid_invoice_cents) * 1000) / 10 : 0;
  const today = new Date();

  const low_stock =
    inventoryRes.data?.filter(
      (r) => Number(r.reorder_level) > 0 && Number(r.quantity) <= Number(r.reorder_level),
    ).length ?? 0;

  const open_tasks = tasks.filter((task) => !["done", "cancelled"].includes(String(task.status ?? ""))).length;
  const blocked_tasks = tasks.filter((task) => String(task.status ?? "") === "blocked").length;
  const tasks_due_today = tasks.filter((task) => {
    if (!task.due_at || ["done", "cancelled"].includes(String(task.status ?? ""))) return false;
    const due = new Date(task.due_at);
    return !Number.isNaN(due.getTime()) && sameLocalDay(due, today);
  }).length;

  const upcoming_jobs = jobs
    .filter((j) => !["completed", "cancelled", "archived"].includes(j.status ?? ""))
    .sort((a, b) => String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? "")))
    .slice(0, 5)
    .map((j) => ({
      id: String(j.id),
      title: String(j.title ?? "Job"),
      job_number: j.job_number != null ? String(j.job_number) : null,
      status: String(j.status ?? "scheduled"),
      property_address: j.property_address != null ? String(j.property_address) : null,
      updated_at: String(j.updated_at ?? j.created_at ?? ""),
    }));

  const jobActivity: OpsActivityItem[] = jobs.slice(0, 12).map((job) => ({
    id: `job-${job.id}`,
    type: "job",
    label: String(job.title ?? "Job updated"),
    meta: `${String(job.status ?? "scheduled").replace(/_/g, " ")} job`,
    href: `/admin/jobs/${job.id}`,
    occurred_at: String(job.updated_at ?? job.created_at ?? ""),
  }));

  const invoiceActivity: OpsActivityItem[] = invoices.slice(0, 12).map((invoice) => ({
    id: `invoice-${invoice.id}`,
    type: "invoice",
    label: String(invoice.title ?? "Invoice"),
    meta: `${formatUsd(cents(invoice.total_cents))} · ${String(invoice.status ?? "draft")}`,
    href: `/invoice/${invoice.public_token}`,
    occurred_at: String(invoice.updated_at ?? invoice.created_at ?? ""),
  }));

  const taskActivity: OpsActivityItem[] = tasks.slice(0, 12).map((task) => ({
    id: `task-${task.id}`,
    type: "task",
    label: String(task.title ?? "Task"),
    meta: `${String(task.priority ?? "normal")} · ${String(task.status ?? "todo").replace(/_/g, " ")}`,
    href: `/admin/jobs/${task.job_id}`,
    occurred_at: String(task.updated_at ?? ""),
  }));

  const expenseActivity: OpsActivityItem[] = expenses.map((expense) => ({
    id: `expense-${expense.id}`,
    type: "expense",
    label: String(expense.vendor ?? expense.category ?? "Expense"),
    meta: `${formatUsd(cents(expense.amount_cents))} · ${String(expense.category ?? "uncategorized")}`,
    href: "/admin/expenses",
    occurred_at: String(expense.created_at ?? ""),
  }));

  const relationalActivity: OpsActivityItem[] = activityRows.map((item) => ({
    id: item.id,
    type: item.event_type.startsWith("invoice") ? "invoice"
      : item.event_type.startsWith("expense") ? "expense"
        : item.event_type.startsWith("task") ? "task"
          : "job",
    label: item.title,
    meta: `${item.actor_name} · ${item.event_type.replace(/\./g, " ")}`,
    href: item.href ?? (item.job_id ? `/admin/jobs/${item.job_id}` : "/admin"),
    occurred_at: item.created_at,
  }));

  const recent_activity = (relationalActivity.length > 0 ? relationalActivity : [...jobActivity, ...invoiceActivity, ...taskActivity, ...expenseActivity])
    .filter((item) => item.occurred_at)
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 10);

  return {
    clients: clientsRes.count ?? 0,
    jobs: jobs.length,
    invoices: invoices.length,
    active_jobs,
    invoice_revenue_cents,
    paid_invoice_cents,
    open_invoice_cents,
    job_revenue_cents,
    expense_cents,
    expense_count,
    profit_signal_cents,
    profit_margin_percent,
    crew_active: crewRes.count ?? 0,
    low_stock,
    open_tasks,
    blocked_tasks,
    tasks_due_today,
    upcoming_jobs,
    recent_activity,
  };
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
