import { invoiceSubtotal } from "./invoice-totals";
import type { Client, CrewPayout, Expense, Invoice, Job, JobStatus } from "./types";

const PROFIT_VIEW_STATUSES: JobStatus[] = ["Scheduled", "In Progress", "Completed", "Paid"];

export type JobProfitTone = "strong" | "thin" | "loss";

export type JobProfitRow = {
  jobId: string;
  clientName: string;
  serviceType: string;
  revenue: number;
  jobSpecificExpenses: number;
  crewPayouts: number;
  estimatedProfit: number;
  marginPct: number;
  paymentMethod: string | null;
  status: JobStatus;
  tone: JobProfitTone;
  jobDate: string;
};

function marginTone(marginPct: number, profit: number): JobProfitTone {
  if (profit < 0) return "loss";
  if (marginPct >= 22) return "strong";
  return "thin";
}

export function computeJobProfitRows(
  jobs: Job[],
  expenses: Expense[],
  payouts: CrewPayout[],
  clients: Client[],
): JobProfitRow[] {
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client";

  const payoutByJob = new Map<string, number>();
  for (const p of payouts) {
    payoutByJob.set(p.jobId, (payoutByJob.get(p.jobId) ?? 0) + p.calculatedTotal);
  }

  const rows: JobProfitRow[] = [];

  for (const j of jobs) {
    if (!PROFIT_VIEW_STATUSES.includes(j.status)) continue;

    const jobSpecificExpenses = expenses
      .filter((e) => e.jobId === j.id && e.expenseType === "Job-specific")
      .reduce((a, e) => a + e.amount, 0);

    const crewPayouts = payoutByJob.get(j.id) ?? 0;
    const revenue = j.revenue;
    const estimatedProfit = revenue - jobSpecificExpenses - crewPayouts;
    const marginPct = revenue > 0 ? (estimatedProfit / revenue) * 100 : estimatedProfit <= 0 ? -100 : 0;
    const tone = marginTone(marginPct, estimatedProfit);

    rows.push({
      jobId: j.id,
      clientName: clientName(j.clientId),
      serviceType: j.serviceType,
      revenue,
      jobSpecificExpenses,
      crewPayouts,
      estimatedProfit,
      marginPct,
      paymentMethod: j.paymentMethod,
      status: j.status,
      tone,
      jobDate: j.date,
    });
  }

  return rows.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
}

/** Paid invoice subtotals in month, grouped by payment method */
export function paidRevenueByPaymentMethodThisMonth(invoices: Invoice[], now: Date): Record<string, number> {
  const inMonth = (iso: string | null) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const keys = ["Cash", "Zelle", "Card", "Check", "Square Invoice", "Other"] as const;
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = 0;
  for (const inv of invoices) {
    if (inv.paymentStatus !== "Paid" || !inMonth(inv.paidDate)) continue;
    const sub = invoiceSubtotal(inv);
    const m = inv.paymentMethod ?? "Other";
    const key = keys.includes(m as (typeof keys)[number]) ? m : "Other";
    out[key] += sub;
  }
  return out;
}

export function grossOperatingMarginPct(revenue: number, jobSpecificCosts: number): number {
  if (revenue <= 0) return 0;
  return ((revenue - jobSpecificCosts) / revenue) * 100;
}
