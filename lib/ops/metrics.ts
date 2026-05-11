import type { OpsMetrics, OpsSnapshot, OpsServiceLine } from "@/lib/ops/types";

export function calculateOpsMetrics(snapshot: OpsSnapshot): OpsMetrics {
  const revenueTotal = sum(snapshot.revenue.map((entry) => entry.amount));
  const paidRevenue = sum(
    snapshot.revenue.filter((entry) => entry.paymentStatus === "paid").map((entry) => entry.amount),
  );
  const pendingRevenue = revenueTotal - paidRevenue;
  const recurringRevenue = sum(
    snapshot.revenue.filter((entry) => entry.recurring).map((entry) => entry.amount),
  );
  const expenseTotal = sum(snapshot.expenses.map((entry) => entry.amount));
  const laborCost = sum(snapshot.labor.map((entry) => entry.hours * entry.hourlyCost));
  const grossProfit = revenueTotal - expenseTotal;
  const invoiceJobs = snapshot.jobs.filter((job) => job.invoiceAmount > 0 || job.quotedAmount > 0);
  const estimatedHours = sum(snapshot.jobs.map((job) => job.estimatedLaborHours));
  const actualHours = sum(snapshot.jobs.map((job) => job.actualLaborHours));

  return {
    revenueTotal,
    paidRevenue,
    pendingRevenue,
    recurringRevenue,
    expenseTotal,
    laborCost,
    grossProfit,
    grossMargin: revenueTotal > 0 ? grossProfit / revenueTotal : 0,
    averageJobValue:
      invoiceJobs.length > 0
        ? sum(invoiceJobs.map((job) => job.invoiceAmount || job.quotedAmount)) / invoiceJobs.length
        : 0,
    activeJobs: snapshot.jobs.filter((job) => ["scheduled", "active", "quoted"].includes(job.status))
      .length,
    quotePipeline: sum(
      snapshot.jobs
        .filter((job) => ["lead", "quoted"].includes(job.status))
        .map((job) => job.quotedAmount),
    ),
    laborUtilization: estimatedHours > 0 ? actualHours / estimatedHours : 0,
    serviceMix: getServiceMix(snapshot),
  };
}

function getServiceMix(snapshot: OpsSnapshot) {
  const totals = new Map<OpsServiceLine, number>();

  for (const entry of snapshot.revenue) {
    totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
  }

  return Array.from(totals.entries()).map(([label, value]) => ({ label, value }));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
