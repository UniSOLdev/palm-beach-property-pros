import { createClient } from "@/lib/supabase/server";
import { getCrewPayoutTotalsByJob } from "@/lib/admin/crew-payout-totals";
import { calculateJobProfit } from "@/lib/admin/job-costing";
import { isTaskOpen, normalizePriority } from "@/lib/admin/task-utils";

export async function getDashboardStats() {
  const supabase = await createClient();

  const [tasksRes, jobsRes, invoicesRes, expensesRes, crewPayoutMap] = await Promise.all([
    supabase.from("tasks").select("id, status, priority, due_date").eq("archived", false),
    supabase.from("jobs").select("*").eq("archived", false),
    supabase.from("invoices").select("id, payment_status, document_status").eq("archived", false),
    supabase.from("expenses").select("amount").eq("archived", false),
    getCrewPayoutTotalsByJob(supabase),
  ]);

  const tasks = tasksRes.data ?? [];
  const jobs = jobsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  const openTasks = tasks.filter((t) => isTaskOpen(t)).length;
  const urgentTasks = tasks.filter((t) => {
    if (!isTaskOpen(t)) return false;
    const p = normalizePriority(t.priority);
    return p === "urgent" || p === "high";
  }).length;
  const activeJobs = jobs.filter((j) => !["Completed", "Cancelled"].includes(j.status)).length;

  let pipeline = 0;
  let marginSum = 0;
  let marginCount = 0;
  for (const job of jobs) {
    const profit = calculateJobProfit({
      revenue: Number(job.revenue),
      job_expense_total: Number(job.job_expense_total),
      estimated_labor_cost: Number(job.estimated_labor_cost ?? 0),
      estimated_materials_cost: Number(job.estimated_materials_cost ?? 0),
      fuel_cost: Number(job.fuel_cost ?? 0),
      dump_fee_cost: Number(job.dump_fee_cost ?? 0),
      truck_rental_cost: Number(job.truck_rental_cost ?? 0),
      equipment_cost: Number(job.equipment_cost ?? 0),
      crew_payout_total: crewPayoutMap[job.id] ?? 0,
    });
    pipeline += Number(job.revenue);
    if (Number(job.revenue) > 0) {
      marginSum += profit.margin;
      marginCount += 1;
    }
  }

  const unpaidInvoices = invoices.filter((i) => i.payment_status !== "Paid").length;
  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const completedJobs = jobs.filter((j) => j.status === "Completed").length;
  const activeClientsRes = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("archived", false);
  const leadsRes = await supabase
    .from("quote_requests")
    .select("id", { count: "exact", head: true })
    .eq("archived", false);

  const activeClients = activeClientsRes.count ?? 0;
  const leadCount = leadsRes.count ?? 0;
  const avgTicket = jobs.length ? pipeline / jobs.length : 0;

  const now = new Date();
  const thisMonth = jobs.filter((j) => {
    const d = new Date(j.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = jobs.filter((j) => {
    const d = new Date(j.created_at);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });
  const thisMonthRev = thisMonth.reduce((s, j) => s + Number(j.revenue), 0);
  const lastMonthRev = lastMonth.reduce((s, j) => s + Number(j.revenue), 0);
  const monthlyGrowth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

  return {
    openTasks,
    urgentTasks,
    activeJobs,
    pipeline,
    avgMargin: marginCount ? marginSum / marginCount : 0,
    unpaidInvoices,
    expenseTotal,
    completedJobs,
    activeClients,
    leadCount,
    avgTicket,
    monthlyGrowth,
  };
}
