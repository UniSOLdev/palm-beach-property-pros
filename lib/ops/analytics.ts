import { createServiceSupabase } from "@/lib/supabase/service";

export type OpsDashboardMetrics = {
  clients: number;
  jobs: number;
  invoices: number;
  active_jobs: number;
  invoice_revenue_cents: number;
  job_revenue_cents: number;
  expense_cents: number;
  expense_count: number;
  profit_signal_cents: number;
  crew_active: number;
  low_stock: number;
};

export async function loadOpsDashboardMetrics(): Promise<OpsDashboardMetrics> {
  const supabase = createServiceSupabase();

  const [clientsRes, jobsRes, invoicesRes, crewRes, expenseTotalsRes, inventoryRes] =
    await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("jobs").select("id, status, revenue_cents"),
      supabase.from("invoices").select("total_cents, status"),
      supabase.from("crew_members").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("expense_totals_v").select("expense_count, total_cents").maybeSingle(),
      supabase.from("inventory_items").select("quantity, reorder_level"),
    ]);

  const jobs = jobsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const active_jobs = jobs.filter((j) => !["completed", "cancelled", "archived"].includes(j.status ?? "")).length;
  const job_revenue_cents = jobs.reduce((s, j) => s + (j.revenue_cents ?? 0), 0);
  const invoice_revenue_cents = invoices.reduce((s, i) => s + (i.total_cents ?? 0), 0);
  const expense_cents = Number((expenseTotalsRes.data as { total_cents?: number } | null)?.total_cents ?? 0);
  const expense_count = Number((expenseTotalsRes.data as { expense_count?: number } | null)?.expense_count ?? 0);

  const low_stock =
    inventoryRes.data?.filter(
      (r) => Number(r.reorder_level) > 0 && Number(r.quantity) <= Number(r.reorder_level),
    ).length ?? 0;

  return {
    clients: clientsRes.count ?? 0,
    jobs: jobs.length,
    invoices: invoices.length,
    active_jobs,
    invoice_revenue_cents,
    job_revenue_cents,
    expense_cents,
    expense_count,
    profit_signal_cents: invoice_revenue_cents - expense_cents,
    crew_active: crewRes.count ?? 0,
    low_stock,
  };
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
