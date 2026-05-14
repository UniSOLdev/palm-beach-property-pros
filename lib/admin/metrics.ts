import { invoiceSubtotal } from "./invoice-totals";
import { adminSeed } from "./seed";
import type { Client, Expense, Invoice, Job, Quote } from "./types";

function invoiceBalance(inv: Invoice) {
  return Math.max(0, invoiceSubtotal(inv) - inv.depositPaid);
}

export function computeDashboardMetricsFrom(
  input: {
    jobs: Job[];
    invoices: Invoice[];
    expenses: Expense[];
    quotes: Quote[];
  },
  now = new Date(),
) {
  const { jobs, invoices, expenses, quotes } = input;

  const inMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const revenueThisMonth = invoices
    .filter((i) => i.paymentStatus === "Paid" && i.paidDate && inMonth(i.paidDate))
    .reduce((acc, i) => acc + invoiceSubtotal(i), 0);

  const expensesThisMonth = expenses.filter((e) => inMonth(e.date)).reduce((acc, e) => acc + e.amount, 0);

  const jobSpecificExpensesMonth = expenses
    .filter((e) => inMonth(e.date) && e.expenseType === "Job-specific")
    .reduce((acc, e) => acc + e.amount, 0);

  const estimatedProfit = revenueThisMonth - expensesThisMonth;

  const openQuotes = quotes.filter((q) => ["Draft", "Sent"].includes(q.status)).length;

  const unpaidInvoices = invoices.filter((i) => ["Unpaid", "Partially Paid", "Overdue"].includes(i.paymentStatus)).length;

  const jobsScheduled = jobs.filter((j) => j.status === "Scheduled" && inMonth(j.date)).length;

  const completedJobs = jobs.filter((j) => ["Completed", "Paid"].includes(j.status) && inMonth(j.date)).length;

  const paidJobs = jobs.filter((j) => j.status === "Paid");
  const averageJobValue =
    paidJobs.length === 0 ? 0 : paidJobs.reduce((acc, j) => acc + j.revenue, 0) / paidJobs.length;

  const cashCollected = invoices
    .filter((i) => i.paymentStatus === "Paid" && i.paymentMethod === "Cash")
    .reduce((acc, i) => acc + invoiceSubtotal(i), 0);

  const cardZelleCollected = invoices
    .filter(
      (i) => i.paymentStatus === "Paid" && (i.paymentMethod === "Card" || i.paymentMethod === "Zelle"),
    )
    .reduce((acc, i) => acc + invoiceSubtotal(i), 0);

  const outstandingBalance = invoices
    .filter((i) => ["Unpaid", "Partially Paid", "Overdue"].includes(i.paymentStatus))
    .reduce((acc, i) => acc + invoiceBalance(i), 0);

  return {
    revenueThisMonth,
    expensesThisMonth,
    jobSpecificExpensesMonth,
    estimatedProfit,
    openQuotes,
    unpaidInvoices,
    jobsScheduled,
    completedJobs,
    averageJobValue,
    cashCollected,
    cardZelleCollected,
    outstandingBalance,
  };
}

export function computeDashboardMetrics(now = new Date()) {
  return computeDashboardMetricsFrom(
    {
      jobs: adminSeed.jobs,
      invoices: adminSeed.invoices,
      expenses: adminSeed.expenses,
      quotes: adminSeed.quotes,
    },
    now,
  );
}

export function revenueByServiceType(jobs: Job[]) {
  const map = new Map<string, number>();
  for (const j of jobs) {
    if (j.revenue <= 0) continue;
    map.set(j.serviceType, (map.get(j.serviceType) ?? 0) + j.revenue);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function bestClientsFrom(clients: Client[], jobs: Job[]) {
  return clients
    .map((c) => {
      const revenue = jobs.filter((j) => j.clientId === c.id).reduce((acc, j) => acc + j.revenue, 0);
      const jobsDone = jobs.filter((j) => j.clientId === c.id && ["Completed", "Paid"].includes(j.status)).length;
      return { client: c, revenue, jobsDone };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function bestClients() {
  return bestClientsFrom(adminSeed.clients, adminSeed.jobs);
}
