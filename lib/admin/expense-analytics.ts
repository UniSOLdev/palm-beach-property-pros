import { createClient } from "@/lib/supabase/server";

export type ExpenseAnalytics = {
  monthlyTotal: number;
  monthlyCount: number;
  byCategory: { category: string; total: number; count: number }[];
  reimbursablePending: number;
  reimbursableCount: number;
  fuelTotal: number;
  softwareTotal: number;
  equipmentTotal: number;
  topVendors: { vendor: string; total: number; count: number }[];
  monthlyTrend: { month: string; total: number }[];
  jobLinkedTotal: number;
  operatingTotal: number;
};

function monthKey(d: string): string {
  return d.slice(0, 7);
}

export async function getExpenseAnalytics(): Promise<ExpenseAnalytics> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const { data: rows } = await supabase
    .from("expenses")
    .select("amount, category, vendor, expense_date, reimbursable, reimbursed, expense_type, job_id")
    .eq("archived", false)
    .order("expense_date", { ascending: false })
    .limit(500);

  const expenses = rows ?? [];
  const thisMonth = expenses.filter((e) => e.expense_date >= monthStart);

  const categoryMap = new Map<string, { total: number; count: number }>();
  const vendorMap = new Map<string, { total: number; count: number }>();
  const trendMap = new Map<string, number>();

  let reimbursablePending = 0;
  let reimbursableCount = 0;
  let fuelTotal = 0;
  let softwareTotal = 0;
  let equipmentTotal = 0;
  let jobLinkedTotal = 0;
  let operatingTotal = 0;

  for (const e of expenses) {
    const amt = Number(e.amount);
    const cat = e.category || "Misc";
    const cur = categoryMap.get(cat) ?? { total: 0, count: 0 };
    cur.total += amt;
    cur.count += 1;
    categoryMap.set(cat, cur);

    const v = (e.vendor || "Unknown").trim();
    const vr = vendorMap.get(v) ?? { total: 0, count: 0 };
    vr.total += amt;
    vr.count += 1;
    vendorMap.set(v, vr);

    const mk = monthKey(e.expense_date);
    trendMap.set(mk, (trendMap.get(mk) ?? 0) + amt);

    if (e.reimbursable && !e.reimbursed) {
      reimbursablePending += amt;
      reimbursableCount += 1;
    }
    if (cat === "Gas/Fuel") fuelTotal += amt;
    if (cat === "Software") softwareTotal += amt;
    if (cat === "Equipment" || cat === "Tools") equipmentTotal += amt;
    if (e.job_id) jobLinkedTotal += amt;
    else operatingTotal += amt;
  }

  const byCategory = [...categoryMap.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total);

  const topVendors = [...vendorMap.entries()]
    .map(([vendor, v]) => ({ vendor, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const monthlyTrend = [...trendMap.entries()]
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  return {
    monthlyTotal: thisMonth.reduce((s, e) => s + Number(e.amount), 0),
    monthlyCount: thisMonth.length,
    byCategory,
    reimbursablePending,
    reimbursableCount,
    fuelTotal,
    softwareTotal,
    equipmentTotal,
    topVendors,
    monthlyTrend,
    jobLinkedTotal,
    operatingTotal,
  };
}
