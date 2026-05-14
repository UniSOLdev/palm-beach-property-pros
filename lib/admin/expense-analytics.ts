import type { Expense, ExpenseCategory, ExpenseType, Job, PaymentMethod } from "./types";

export function isInCalendarMonth(isoDate: string, now: Date): boolean {
  const d = new Date(isoDate);
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function monthBounds(ym: string): { from: string; to: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const last = new Date(y, mo, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { from: `${y}-${pad(mo)}-01`, to: `${y}-${pad(mo)}-${pad(last)}` };
}

export function sumByExpenseType(expenses: Expense[], type: ExpenseType): number {
  return expenses.filter((e) => e.expenseType === type).reduce((a, e) => a + e.amount, 0);
}

export type CategorySpendRow = {
  category: ExpenseCategory;
  total: number;
  percentOfTotal: number;
  count: number;
};

export function categorySpendRows(expenses: Expense[], categories: readonly ExpenseCategory[]): CategorySpendRow[] {
  const totalAll = expenses.reduce((a, e) => a + e.amount, 0) || 1;
  const rows: CategorySpendRow[] = [];
  for (const category of categories) {
    const list = expenses.filter((e) => e.category === category);
    const total = list.reduce((a, e) => a + e.amount, 0);
    rows.push({
      category,
      total,
      percentOfTotal: (total / totalAll) * 100,
      count: list.length,
    });
  }
  return rows.sort((a, b) => b.total - a.total);
}

export function largestVendor(expenses: Expense[]): { vendor: string; total: number } | null {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const v = e.vendor.trim() || "—";
    map.set(v, (map.get(v) ?? 0) + e.amount);
  }
  let best: { vendor: string; total: number } | null = null;
  for (const [vendor, total] of map) {
    if (!best || total > best.total) best = { vendor, total };
  }
  return best;
}

export function mostCommonCategory(expenses: Expense[]): ExpenseCategory | null {
  const map = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + 1);
  }
  let best: ExpenseCategory | null = null;
  let n = 0;
  for (const [c, count] of map) {
    if (count > n) {
      n = count;
      best = c;
    }
  }
  return best;
}

export function paymentMethodExpenseTotals(expenses: Expense[]): Record<PaymentMethod, number> & { Other: number } {
  const base: Record<PaymentMethod, number> = {
    Cash: 0,
    Zelle: 0,
    Card: 0,
    Check: 0,
    "Square Invoice": 0,
    Other: 0,
  };
  for (const e of expenses) {
    const m = e.paymentMethod in base ? e.paymentMethod : "Other";
    base[m] += e.amount;
  }
  return base;
}

export type ExpenseMonthKpis = {
  totalExpenses: number;
  jobSpecific: number;
  reusableSupplies: number;
  equipment: number;
  overhead: number;
  reimbursableAmount: number;
  unreimbursedAmount: number;
  averageExpensePerJobWithSpend: number;
  jobsWithJobSpecificSpend: number;
  largestCategory: ExpenseCategory | null;
  largestCategoryAmount: number;
};

export function computeExpenseMonthKpis(expenses: Expense[], jobs: Job[], now: Date): ExpenseMonthKpis {
  const monthExp = expenses.filter((e) => isInCalendarMonth(e.date, now));
  const totalExpenses = monthExp.reduce((a, e) => a + e.amount, 0);
  const jobSpecific = sumByExpenseType(monthExp, "Job-specific");
  const reusableSupplies = sumByExpenseType(monthExp, "Reusable supplies");
  const equipment = sumByExpenseType(monthExp, "Equipment investment");
  const overhead = sumByExpenseType(monthExp, "Overhead");

  const reimbursableAmount = monthExp.filter((e) => e.reimbursable).reduce((a, e) => a + e.amount, 0);
  const unreimbursedAmount = monthExp
    .filter((e) => e.reimbursable && !e.reimbursed)
    .reduce((a, e) => a + e.amount, 0);

  const jobIds = new Set<string>();
  for (const e of monthExp) {
    if (e.expenseType === "Job-specific" && e.jobId) jobIds.add(e.jobId);
  }
  const jobsWithJobSpecificSpend = jobIds.size;
  const averageExpensePerJobWithSpend =
    jobsWithJobSpecificSpend === 0 ? 0 : jobSpecific / jobsWithJobSpecificSpend;

  let largestCategory: ExpenseCategory | null = null;
  let largestCategoryAmount = 0;
  const catTotals = new Map<ExpenseCategory, number>();
  for (const e of monthExp) {
    catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.amount);
  }
  for (const [c, amt] of catTotals) {
    if (amt > largestCategoryAmount) {
      largestCategoryAmount = amt;
      largestCategory = c;
    }
  }

  return {
    totalExpenses,
    jobSpecific,
    reusableSupplies,
    equipment,
    overhead,
    reimbursableAmount,
    unreimbursedAmount,
    averageExpensePerJobWithSpend,
    jobsWithJobSpecificSpend,
    largestCategory,
    largestCategoryAmount,
  };
}

export function businessInvestmentVsJobCost(expenses: Expense[], inMonthFilter: (e: Expense) => boolean) {
  const slice = expenses.filter(inMonthFilter);
  return {
    jobSpecific: sumByExpenseType(slice, "Job-specific"),
    reusableSupplies: sumByExpenseType(slice, "Reusable supplies"),
    equipment: sumByExpenseType(slice, "Equipment investment"),
    overhead: sumByExpenseType(slice, "Overhead"),
    totalAll: slice.reduce((a, e) => a + e.amount, 0),
  };
}
