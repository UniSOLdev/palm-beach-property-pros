import type { JobExpenseRow, JobCrewPayoutRow } from "@/lib/admin/types-jobs";

export type JobProfitBreakdown = {
  revenue: number;
  linkedExpenses: number;
  crewPayouts: number;
  directCosts: number;
  totalCost: number;
  profit: number;
  margin: number;
};

/**
 * Job command center profit: linked expense rows + crew payouts + on-job cost fields.
 * Does not use jobs.job_expense_total (avoids double-count with linked expenses).
 */
export function calculateJobProfitDetail(input: {
  revenue: number;
  expenses: JobExpenseRow[];
  crewPayouts: JobCrewPayoutRow[];
  estimated_labor_cost: number;
  estimated_materials_cost: number;
  fuel_cost: number;
  dump_fee_cost: number;
  truck_rental_cost: number;
  equipment_cost: number;
}): JobProfitBreakdown {
  const revenue = Number(input.revenue);
  const linkedExpenses = input.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const crewPayouts = input.crewPayouts.reduce((s, p) => s + Number(p.calculated_total), 0);
  const directCosts =
    Number(input.estimated_labor_cost) +
    Number(input.estimated_materials_cost) +
    Number(input.fuel_cost) +
    Number(input.dump_fee_cost) +
    Number(input.truck_rental_cost) +
    Number(input.equipment_cost);

  const totalCost = linkedExpenses + crewPayouts + directCosts;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { revenue, linkedExpenses, crewPayouts, directCosts, totalCost, profit, margin };
}
