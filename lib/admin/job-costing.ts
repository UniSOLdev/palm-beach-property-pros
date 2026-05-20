export type JobCostInput = {
  revenue: number;
  job_expense_total: number;
  estimated_labor_cost: number;
  estimated_materials_cost: number;
  fuel_cost: number;
  dump_fee_cost: number;
  truck_rental_cost: number;
  equipment_cost: number;
  crew_payout_total?: number;
};

/**
 * List/dashboard rollup: uses jobs.job_expense_total (synced when adding job expenses)
 * plus on-job cost fields and optional crew_payout_total. Does not load expense line items.
 */
export function calculateJobProfit(job: JobCostInput) {
  const actualCosts =
    Number(job.job_expense_total) +
    Number(job.fuel_cost) +
    Number(job.dump_fee_cost) +
    Number(job.truck_rental_cost) +
    Number(job.equipment_cost) +
    Number(job.estimated_materials_cost) +
    Number(job.estimated_labor_cost) +
    Number(job.crew_payout_total ?? 0);

  const estimatedCosts =
    Number(job.estimated_labor_cost) +
    Number(job.estimated_materials_cost) +
    Number(job.fuel_cost) +
    Number(job.dump_fee_cost) +
    Number(job.truck_rental_cost) +
    Number(job.equipment_cost);

  const revenue = Number(job.revenue);
  const actualProfit = revenue - actualCosts;
  const estimatedProfit = revenue - estimatedCosts;
  const margin = revenue > 0 ? (actualProfit / revenue) * 100 : 0;

  return { actualCosts, estimatedCosts, actualProfit, estimatedProfit, margin };
}
