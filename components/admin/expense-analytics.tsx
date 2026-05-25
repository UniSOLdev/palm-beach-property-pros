"use client";

import { formatCurrency } from "@/lib/admin/format";
import type { ExpenseAnalytics } from "@/lib/admin/expense-analytics";

export function ExpenseAnalyticsPanel({ analytics }: { analytics: ExpenseAnalytics }) {
  const maxCategory = Math.max(...analytics.byCategory.map((c) => c.total), 1);
  const maxTrend = Math.max(...analytics.monthlyTrend.map((m) => m.total), 1);
  const pieTotal = analytics.byCategory.reduce((s, c) => s + c.total, 0) || 1;

  const cards = [
    { label: "This month", value: formatCurrency(analytics.monthlyTotal), sub: `${analytics.monthlyCount} expenses` },
    { label: "Reimbursements due", value: formatCurrency(analytics.reimbursablePending), sub: `${analytics.reimbursableCount} pending` },
    { label: "Fuel", value: formatCurrency(analytics.fuelTotal), sub: "Gas/Fuel category" },
    { label: "Software", value: formatCurrency(analytics.softwareTotal), sub: "Subscriptions & tools" },
    { label: "Equipment & tools", value: formatCurrency(analytics.equipmentTotal), sub: "Capital spend" },
    { label: "Job-linked", value: formatCurrency(analytics.jobLinkedTotal), sub: "vs operating" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="admin-card">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal/50">{c.label}</p>
            <p className="mt-1 text-lg font-bold text-navy">{c.value}</p>
            <p className="text-xs text-charcoal/55">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card space-y-3">
          <h3 className="text-sm font-bold text-navy">Monthly trend</h3>
          <div className="flex items-end gap-2" style={{ height: 96 }}>
            {analytics.monthlyTrend.length === 0 ? (
              <p className="text-sm text-charcoal/55">No expense history yet.</p>
            ) : (
              analytics.monthlyTrend.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-ocean"
                    style={{ height: `${Math.max(8, (m.total / maxTrend) * 100)}%`, minHeight: 8 }}
                    title={`${m.month}: ${formatCurrency(m.total)}`}
                  />
                  <span className="text-[9px] text-charcoal/50">{m.month.slice(5)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card space-y-3">
          <h3 className="text-sm font-bold text-navy">By category</h3>
          <ul className="space-y-2">
            {analytics.byCategory.slice(0, 8).map((c) => (
              <li key={c.category}>
                <div className="flex justify-between text-xs font-medium text-navy">
                  <span>{c.category}</span>
                  <span>{formatCurrency(c.total)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-sky/30">
                  <div
                    className="h-full rounded-full bg-ocean"
                    style={{ width: `${(c.total / maxCategory) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {analytics.byCategory.length > 0 ? (
            <div className="flex h-3 overflow-hidden rounded-full">
              {analytics.byCategory.slice(0, 6).map((c, i) => {
                const colors = ["#2A6F97", "#6A8F6B", "#5ec8dc", "#c4a35a", "#8b6b8b", "#4a5568"];
                const pct = (c.total / pieTotal) * 100;
                return (
                  <div
                    key={c.category}
                    style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                    title={`${c.category} ${formatCurrency(c.total)}`}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {analytics.topVendors.length > 0 ? (
        <div className="admin-card">
          <h3 className="text-sm font-bold text-navy">Recurring vendors</h3>
          <ul className="mt-2 divide-y divide-navy/5">
            {analytics.topVendors.map((v) => (
              <li key={v.vendor} className="flex justify-between py-2 text-sm">
                <span className="font-medium text-navy">{v.vendor}</span>
                <span className="text-charcoal/70">
                  {formatCurrency(v.total)} · {v.count}×
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
