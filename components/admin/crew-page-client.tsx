"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/admin/format";
import type { CrewMember, CrewPayout, Job } from "@/lib/admin/types";
import { saveCrewPayoutAction } from "@/lib/admin/actions";

type PayType = "flat rate" | "hourly" | "percentage";

export function CrewPageClient({
  initialJobs,
  initialCrew,
  initialPayouts,
  dataMode,
}: {
  initialJobs: Job[];
  initialCrew: CrewMember[];
  initialPayouts: CrewPayout[];
  dataMode: "supabase" | "seed";
}) {
  const [jobId, setJobId] = useState(initialJobs[0]?.id ?? "");
  const [revenue, setRevenue] = useState(initialJobs[0]?.revenue ?? 0);
  const [jobExpenses, setJobExpenses] = useState(initialJobs[0]?.jobExpenseTotal ?? 0);
  const [selected, setSelected] = useState<string[]>(() => initialCrew.slice(0, 2).map((c) => c.id));
  const [payType, setPayType] = useState<PayType>("hourly");
  const [hours, setHours] = useState(6);
  const [percent, setPercent] = useState(35);
  const [flat, setFlat] = useState(250);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const j = initialJobs.find((x) => x.id === jobId);
    if (!j) return;
    setRevenue(j.revenue);
    setJobExpenses(j.jobExpenseTotal);
  }, [jobId, initialJobs]);

  const payout = useMemo(() => {
    if (payType === "hourly") {
      const rateSum = selected.reduce((acc, id) => {
        const m = initialCrew.find((c) => c.id === id);
        return acc + (m?.defaultPayRate ?? 0);
      }, 0);
      return hours * rateSum;
    }
    if (payType === "percentage") {
      return (percent / 100) * Math.max(0, revenue - jobExpenses);
    }
    return flat;
  }, [flat, hours, jobExpenses, initialCrew, payType, percent, revenue, selected]);

  const netBusiness = Math.max(0, revenue - jobExpenses - payout);

  const toggle = (id: string) => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  async function savePayout() {
    if (dataMode !== "supabase" || !jobId) return;
    const fd = new FormData();
    fd.set("job_id", jobId);
    fd.set("pay_type", payType);
    fd.set("hours", String(hours));
    fd.set("percent", String(percent));
    fd.set("flat_amount", String(flat));
    fd.set("calculated_total", String(payout));
    for (const id of selected) fd.append("crew_member_id", id);
    const res = await saveCrewPayoutAction(fd);
    setSaveMsg(res.ok ? "Saved payout record." : res.error);
    if (res.ok) router.refresh();
    setTimeout(() => setSaveMsg(null), 3200);
  }

  return (
    <div>
      <AdminPageHeader
        title="Crew"
        subtitle="Roster plus a payout calculator for move-outs, turnovers, and multi-tech days."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Team roster">
          <div className="divide-y divide-navy/10">
            {initialCrew.map((m) => (
              <div key={m.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-navy">{m.name}</div>
                  <div className="text-sm text-charcoal/70">
                    {m.role} · Default {formatCurrency(m.defaultPayRate)}/{m.payRateUnit}
                  </div>
                  <div className="text-xs text-charcoal/55">{m.notes}</div>
                </div>
                <div className="text-sm font-semibold text-charcoal/70">{m.phone}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Crew pay calculator">
          <div className="grid gap-3 text-sm">
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Job</span>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              >
                {initialJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.serviceType} · {j.date}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Job revenue</span>
              <input
                type="number"
                min={0}
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Job-specific expenses</span>
              <input
                type="number"
                min={0}
                value={jobExpenses}
                onChange={(e) => setJobExpenses(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              />
            </label>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Crew on job</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {initialCrew.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      selected.includes(m.id) ? "border-navy bg-navy text-white" : "border-navy/15 bg-white text-navy"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Pay type</span>
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value as PayType)}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
              >
                <option value="hourly">Hourly (sum of default rates × hours)</option>
                <option value="percentage">Percentage of profit pool (revenue − job expenses)</option>
                <option value="flat rate">Flat rate</option>
              </select>
            </label>

            {payType === "hourly" ? (
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Hours</span>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
            ) : null}

            {payType === "percentage" ? (
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Percent</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
            ) : null}

            {payType === "flat rate" ? (
              <label>
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Flat payout</span>
                <input
                  type="number"
                  min={0}
                  value={flat}
                  onChange={(e) => setFlat(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm outline-none ring-ocean/30 focus:ring-2"
                />
              </label>
            ) : null}

            <div className="rounded-2xl border border-navy/10 bg-sky/40 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/70">Suggested payout</span>
                <span className="font-bold text-navy">{formatCurrency(payout)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-charcoal/70">Remaining business profit</span>
                <span className="font-bold text-leaf">{formatCurrency(netBusiness)}</span>
              </div>
              {dataMode === "supabase" ? (
                <button type="button" className="btn-primary mt-3 w-full" onClick={() => void savePayout()}>
                  Save payout to Supabase
                </button>
              ) : (
                <p className="mt-3 text-xs text-charcoal/60">
                  Demo mode: configure Supabase to persist payouts into <code className="rounded bg-white/60 px-1">crew_payouts</code>.
                </p>
              )}
              {saveMsg ? <p className="mt-2 text-xs font-semibold text-navy">{saveMsg}</p> : null}
            </div>
          </div>
        </Card>
      </div>

      {initialPayouts.length ? (
        <div className="mt-6">
          <Card title="Recent payouts">
            <div className="divide-y divide-navy/10 text-sm">
              {initialPayouts.slice(0, 8).map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="font-semibold text-navy">{p.payType}</div>
                  <div className="text-charcoal/70">{formatCurrency(p.calculatedTotal)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
