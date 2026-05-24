"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/admin/format";

export type DashboardAnalyticsProps = {
  stats: {
    activeJobs: number;
    unpaidInvoices: number;
    pipeline: number;
    avgMargin: number;
    expenseTotal: number;
    openTasks: number;
    completedJobs: number;
    activeClients: number;
    leadCount: number;
    avgTicket: number;
    monthlyGrowth: number;
  };
};

export function DashboardAnalytics({ stats }: DashboardAnalyticsProps) {
  const metrics = [
    { label: "Revenue pipeline", value: formatCurrency(stats.pipeline), href: "/admin/jobs", trend: stats.monthlyGrowth },
    { label: "Jobs completed", value: String(stats.completedJobs), href: "/admin/jobs" },
    { label: "Outstanding invoices", value: String(stats.unpaidInvoices), href: "/admin/invoices", highlight: stats.unpaidInvoices > 0 },
    { label: "Active clients", value: String(stats.activeClients), href: "/admin/clients" },
    { label: "Open tasks", value: String(stats.openTasks), href: "/admin/tasks" },
    { label: "Avg ticket", value: formatCurrency(stats.avgTicket), href: "/admin/jobs" },
    { label: "Avg margin", value: formatPercent(stats.avgMargin), href: "/admin/jobs" },
    { label: "Lead pipeline", value: String(stats.leadCount), href: "/admin/leads" },
  ];

  const chartData = [
    { label: "Revenue", value: stats.pipeline, color: "#2A6F97" },
    { label: "Expenses", value: stats.expenseTotal, color: "#6A8F6B" },
    { label: "Pipeline", value: stats.pipeline - stats.expenseTotal, color: "#5ec8dc" },
  ];
  const maxVal = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="space-y-4">
      <div className="studio-glass p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ocean">Business intelligence</p>
            <h2 className="mt-1 text-lg font-bold text-navy">Operations overview</h2>
          </div>
          {stats.monthlyGrowth !== 0 ? (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stats.monthlyGrowth > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {stats.monthlyGrowth > 0 ? "+" : ""}{stats.monthlyGrowth.toFixed(1)}% MoM
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-end gap-3" style={{ height: 80 }}>
          {chartData.map((bar, i) => (
            <motion.div
              key={bar.label}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(8, (bar.value / maxVal) * 100)}%` }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
              className="flex-1 rounded-t-lg"
              style={{ backgroundColor: bar.color }}
              title={`${bar.label}: ${formatCurrency(bar.value)}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-charcoal/50">
          {chartData.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              href={m.href}
              className={`metric-card ${m.highlight ? "ring-2 ring-amber-300/60" : ""}`}
            >
              <p className="metric-card-label">{m.label}</p>
              <p className="metric-card-value">{m.value}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="studio-panel">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-navy">Month expenses</h3>
          <Link href="/admin/expenses" className="text-xs font-semibold text-ocean no-underline">
            View all →
          </Link>
        </div>
        <p className="metric-card-value">{formatCurrency(stats.expenseTotal)}</p>
      </section>
    </div>
  );
}
