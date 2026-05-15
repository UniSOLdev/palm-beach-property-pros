"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  labelForPayType,
  marginToneClass,
  PAY_TYPES,
} from "@/lib/crew-constants";
import {
  calculateJobPayouts,
  type PayoutLineInput,
  type PayoutResult,
} from "@/lib/crew-payout";

export type PayoutJobOption = {
  id: string;
  label: string;
  revenue_cents: number;
  expense_cents: number;
  crew_names: string[];
};

export type PayoutMemberOption = {
  id: string;
  full_name: string;
  default_pay_type: string;
  default_pay_rate_cents: number;
  default_pay_percent: number;
  lead_bonus_percent: number;
  trainee_pay_multiplier: number;
  role: string;
};

function fmtMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function dollarsToCents(s: string): number {
  const n = Number.parseFloat(String(s).replace(/[$,]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function emptyLine(id: string): PayoutLineInput {
  return {
    id,
    name: "",
    pay_type: "split",
    pay_rate_cents: 0,
    hours: 0,
    split_percent: 0,
    is_lead: false,
    trainee_multiplier: 1,
    flat_bonus_cents: 0,
    lead_bonus_percent: 10,
  };
}

type Props = {
  jobs: PayoutJobOption[];
  members: PayoutMemberOption[];
  initialJobId?: string;
};

export function CrewPayoutCalculator({ jobs, members, initialJobId }: Props) {
  const initialJob = jobs.find((j) => j.id === initialJobId) ?? jobs[0];

  const [selectedJobId, setSelectedJobId] = useState(initialJob?.id ?? "");
  const [revenueDollars, setRevenueDollars] = useState(centsToDollars(initialJob?.revenue_cents ?? 0));
  const [expenseDollars, setExpenseDollars] = useState(centsToDollars(initialJob?.expense_cents ?? 0));
  const [laborPoolMode, setLaborPoolMode] = useState<"percent" | "fixed">("percent");
  const [laborPoolPercent, setLaborPoolPercent] = useState("33");
  const [laborPoolDollars, setLaborPoolDollars] = useState("500.00");
  const [lines, setLines] = useState<PayoutLineInput[]>(() => {
    if (initialJob?.crew_names.length) {
      return initialJob.crew_names.map((name, i) => ({ ...emptyLine(`line-${i}`), name }));
    }
    return [emptyLine("line-0")];
  });

  const result: PayoutResult = useMemo(() => {
    return calculateJobPayouts({
      revenue_cents: dollarsToCents(revenueDollars),
      expense_cents: dollarsToCents(expenseDollars),
      labor_pool_cents: laborPoolMode === "fixed" ? dollarsToCents(laborPoolDollars) : null,
      labor_pool_percent: Number.parseFloat(laborPoolPercent) || 0,
      lines,
    });
  }, [revenueDollars, expenseDollars, laborPoolMode, laborPoolDollars, laborPoolPercent, lines]);

  function loadJob(jobId: string) {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    setSelectedJobId(jobId);
    setRevenueDollars(centsToDollars(job.revenue_cents));
    setExpenseDollars(centsToDollars(job.expense_cents));
    if (job.crew_names.length) {
      setLines(job.crew_names.map((name, i) => ({ ...emptyLine(`line-${i}`), name })));
    }
  }

  function addFromRoster(memberId: string) {
    const m = members.find((x) => x.id === memberId);
    if (!m) return;
    setLines((prev) => [
      ...prev,
      {
        id: m.id,
        name: m.full_name,
        pay_type: m.default_pay_type as PayoutLineInput["pay_type"],
        pay_rate_cents: m.default_pay_rate_cents,
        hours: 0,
        split_percent: Number(m.default_pay_percent) || 0,
        is_lead: m.role === "lead_tech",
        trainee_multiplier: m.role === "trainee" ? Number(m.trainee_pay_multiplier) || 0.75 : 1,
        flat_bonus_cents: 0,
        lead_bonus_percent: Number(m.lead_bonus_percent) || 10,
      },
    ]);
  }

  function updateLine(id: string, patch: Partial<PayoutLineInput>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/[0.05] md:p-6">
      <SectionHeader
        title="Crew payout calculator"
        subtitle="Revenue, expenses, labor pool, and per-tech distribution — hourly, flat, %, or split."
      />

      {jobs.length > 0 ? (
        <CalcField label="Load from job" className="mt-5">
          <select
            value={selectedJobId}
            onChange={(e) => loadJob(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
          >
            <option value="">— Manual entry —</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
              </option>
            ))}
          </select>
        </CalcField>
      ) : null}

      <CalcGrid className="mt-5">
        <CalcField label="Job revenue (USD)">
          <input
            inputMode="decimal"
            value={revenueDollars}
            onChange={(e) => setRevenueDollars(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
          />
        </CalcField>
        <CalcField label="Job expenses (USD)">
          <input
            inputMode="decimal"
            value={expenseDollars}
            onChange={(e) => setExpenseDollars(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
          />
        </CalcField>
      </CalcGrid>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setLaborPoolMode("percent")}
          className={chipClass(laborPoolMode === "percent")}
        >
          Labor % of (revenue − expenses)
        </button>
        <button type="button" onClick={() => setLaborPoolMode("fixed")} className={chipClass(laborPoolMode === "fixed")}>
          Fixed labor pool
        </button>
      </div>

      <CalcGrid className="mt-4">
        {laborPoolMode === "percent" ? (
          <CalcField label="Labor pool %">
            <input
              inputMode="decimal"
              value={laborPoolPercent}
              onChange={(e) => setLaborPoolPercent(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            />
          </CalcField>
        ) : (
          <CalcField label="Labor pool (USD)">
            <input
              inputMode="decimal"
              value={laborPoolDollars}
              onChange={(e) => setLaborPoolDollars(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            />
          </CalcField>
        )}
      </CalcGrid>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Job revenue" value={fmtMoney(result.revenue_cents)} />
        <SummaryTile label="Job expenses" value={fmtMoney(result.expense_cents)} />
        <SummaryTile label="Labor pool" value={fmtMoney(result.labor_pool_cents)} highlight />
        <SummaryTile
          label="Business profit"
          value={fmtMoney(result.business_profit_cents)}
          sub={`Margin ${result.profit_margin_percent.toFixed(1)}%`}
          subClass={marginToneClass(result.profit_margin_percent)}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Crew lines</p>
        <RosterAdd members={members} onAdd={addFromRoster} />
      </div>

      <PayoutLines
        lines={lines}
        onUpdate={updateLine}
        onAdd={() => setLines((p) => [...p, emptyLine(`line-${p.length}`)])}
        onRemove={(id) => setLines((p) => (p.length <= 1 ? p : p.filter((l) => l.id !== id)))}
      />

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-black/30">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Tech</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-200">
            {result.payouts.length ? (
              result.payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{p.detail}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-sky-100">{fmtMoney(p.amount_cents)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-zinc-500">
                  Add crew names to preview payouts.
                </td>
              </tr>
            )}
          </tbody>
          {result.payouts.length ? (
            <tfoot>
              <tr className="border-t border-white/10 text-sm">
                <td className="px-4 py-3 font-semibold text-white" colSpan={2}>
                  Total labor payout
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-white">
                  {fmtMoney(result.total_labor_payout_cents)}
                </td>
              </tr>
              {result.unallocated_labor_cents !== 0 ? (
                <tr>
                  <td className="px-4 py-2 text-xs text-amber-200/90" colSpan={3}>
                    Unallocated from labor pool: {fmtMoney(result.unallocated_labor_cents)}
                  </td>
                </tr>
              ) : null}
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  );
}

function chipClass(active: boolean) {
  return [
    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
    active ? "border-sky-400/40 bg-sky-500/15 text-sky-100" : "border-white/10 bg-black/30 text-zinc-400 hover:text-zinc-200",
  ].join(" ");
}

function SummaryTile({
  label,
  value,
  sub,
  subClass,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  subClass?: string;
  highlight?: boolean;
}) {
  return (
    <Div
      className={[
        "rounded-xl border px-4 py-3",
        highlight ? "border-sky-400/25 bg-sky-500/10" : "border-white/10 bg-black/30",
      ].join(" ")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
      {sub ? <p className={`mt-1 text-xs ${subClass ?? "text-zinc-500"}`}>{sub}</p> : null}
    </Div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

function CalcField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function CalcGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-4 md:grid-cols-2 ${className ?? ""}`}>{children}</div>;
}

function Div({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function RosterAdd({ members, onAdd }: { members: PayoutMemberOption[]; onAdd: (id: string) => void }) {
  if (!members.length) return null;
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) onAdd(e.target.value);
        e.target.value = "";
      }}
      className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-zinc-200 outline-none"
    >
      <option value="">+ From roster</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.full_name}
        </option>
      ))}
    </select>
  );
}

function PayoutLines({
  lines,
  onUpdate,
  onAdd,
  onRemove,
}: {
  lines: PayoutLineInput[];
  onUpdate: (id: string, patch: Partial<PayoutLineInput>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      {lines.map((line) => (
        <div key={line.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              placeholder="Name"
              value={line.name}
              onChange={(e) => onUpdate(line.id, { name: e.target.value })}
              className="rounded-lg border border-white/10 bg-transparent px-2 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            />
            <select
              value={line.pay_type}
              onChange={(e) => onUpdate(line.id, { pay_type: e.target.value as PayoutLineInput["pay_type"] })}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white outline-none"
            >
              {PAY_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {(line.pay_type === "hourly" || line.pay_type === "flat") && (
              <input
                inputMode="decimal"
                placeholder={line.pay_type === "hourly" ? "Rate $/hr" : "Flat $"}
                value={(line.pay_rate_cents / 100).toFixed(2)}
                onChange={(e) => onUpdate(line.id, { pay_rate_cents: dollarsToCents(e.target.value) })}
                className="rounded-lg border border-white/10 bg-transparent px-2 py-2 text-sm text-white outline-none"
              />
            )}
            {line.pay_type === "hourly" && (
              <input
                inputMode="decimal"
                placeholder="Hours"
                value={line.hours || ""}
                onChange={(e) => onUpdate(line.id, { hours: Number.parseFloat(e.target.value) || 0 })}
                className="rounded-lg border border-white/10 bg-transparent px-2 py-2 text-sm text-white outline-none"
              />
            )}
            {(line.pay_type === "percentage" || line.pay_type === "split") && (
              <input
                inputMode="decimal"
                placeholder={line.pay_type === "percentage" ? "% of pool" : "Split weight"}
                value={line.split_percent || ""}
                onChange={(e) => onUpdate(line.id, { split_percent: Number.parseFloat(e.target.value) || 0 })}
                className="rounded-lg border border-white/10 bg-transparent px-2 py-2 text-sm text-white outline-none"
              />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-2 text-zinc-400">
              <input type="checkbox" checked={line.is_lead} onChange={(e) => onUpdate(line.id, { is_lead: e.target.checked })} />
              Lead bonus
            </label>
            <input
              inputMode="decimal"
              placeholder="Lead %"
              value={line.lead_bonus_percent}
              onChange={(e) => onUpdate(line.id, { lead_bonus_percent: Number.parseFloat(e.target.value) || 0 })}
              className="w-16 rounded border border-white/10 bg-transparent px-2 py-1 text-white"
            />
            <input
              inputMode="decimal"
              placeholder="Trainee ×"
              value={line.trainee_multiplier}
              onChange={(e) => onUpdate(line.id, { trainee_multiplier: Number.parseFloat(e.target.value) || 1 })}
              className="w-16 rounded border border-white/10 bg-transparent px-2 py-1 text-white"
            />
            <input
              inputMode="decimal"
              placeholder="Flat bonus $"
              value={(line.flat_bonus_cents / 100).toFixed(2)}
              onChange={(e) => onUpdate(line.id, { flat_bonus_cents: dollarsToCents(e.target.value) })}
              className="w-24 rounded border border-white/10 bg-transparent px-2 py-1 text-white"
            />
            <span className="text-zinc-600">{labelForPayType(line.pay_type)}</span>
            <button type="button" onClick={() => onRemove(line.id)} className="ml-auto text-rose-300 hover:underline">
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-sky-400/30 hover:text-sky-200"
      >
        + Add crew line
      </button>
    </div>
  );
}
