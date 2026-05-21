import type { PayTypeValue } from "@/lib/crew-constants";
import type { CrewAssignment } from "@/lib/db-types";

export type PayoutLineInput = {
  id: string;
  name: string;
  pay_type: PayTypeValue;
  pay_rate_cents: number;
  hours: number;
  split_percent: number;
  is_lead: boolean;
  trainee_multiplier: number;
  flat_bonus_cents: number;
  lead_bonus_percent: number;
};

export type JobPayoutInput = {
  revenue_cents: number;
  expense_cents: number;
  labor_pool_cents: number | null;
  labor_pool_percent: number;
  lines: PayoutLineInput[];
};

export type PersonPayout = {
  id: string;
  name: string;
  amount_cents: number;
  detail: string;
};

export type PayoutResult = {
  revenue_cents: number;
  expense_cents: number;
  labor_pool_cents: number;
  business_profit_cents: number;
  profit_margin_percent: number;
  labor_percent: number;
  payouts: PersonPayout[];
  total_labor_payout_cents: number;
  unallocated_labor_cents: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function resolveLaborPoolCents(input: JobPayoutInput): number {
  if (input.labor_pool_cents != null && input.labor_pool_cents >= 0) {
    return Math.round(input.labor_pool_cents);
  }
  const afterExpenses = Math.max(0, input.revenue_cents - input.expense_cents);
  const pct = clamp(input.labor_pool_percent, 0, 100);
  return Math.round(afterExpenses * (pct / 100));
}

export function calculateJobPayouts(input: JobPayoutInput): PayoutResult {
  const revenue_cents = Math.max(0, Math.round(input.revenue_cents));
  const expense_cents = Math.max(0, Math.round(input.expense_cents));
  const labor_pool_cents = resolveLaborPoolCents(input);
  const business_profit_cents = revenue_cents - expense_cents - labor_pool_cents;
  const profit_margin_percent = revenue_cents > 0 ? (business_profit_cents / revenue_cents) * 100 : 0;
  const labor_percent = revenue_cents > 0 ? (labor_pool_cents / revenue_cents) * 100 : 0;

  const lines = input.lines.filter((l) => l.name.trim());
  const payouts: PersonPayout[] = [];
  let fixedTotal = 0;

  const hourlyLines = lines.filter((l) => l.pay_type === "hourly");
  const flatLines = lines.filter((l) => l.pay_type === "flat");
  const pctLines = lines.filter((l) => l.pay_type === "percentage");
  const splitLines = lines.filter((l) => l.pay_type === "split");

  for (const line of hourlyLines) {
    const mult = line.trainee_multiplier > 0 ? line.trainee_multiplier : 1;
    let amt = Math.round(line.pay_rate_cents * Math.max(0, line.hours) * mult);
    if (line.is_lead) amt += Math.round(amt * (line.lead_bonus_percent / 100));
    amt += line.flat_bonus_cents;
    fixedTotal += amt;
    payouts.push({
      id: line.id,
      name: line.name,
      amount_cents: amt,
      detail: `${line.hours}h × $${(line.pay_rate_cents / 100).toFixed(2)}/hr`,
    });
  }

  for (const line of flatLines) {
    const mult = line.trainee_multiplier > 0 ? line.trainee_multiplier : 1;
    let amt = Math.round(line.pay_rate_cents * mult);
    if (line.is_lead) amt += Math.round(amt * (line.lead_bonus_percent / 100));
    amt += line.flat_bonus_cents;
    fixedTotal += amt;
    payouts.push({
      id: line.id,
      name: line.name,
      amount_cents: amt,
      detail: "Flat rate",
    });
  }

  const poolRemaining = Math.max(0, labor_pool_cents - fixedTotal);

  const totalSplitWeight = splitLines.reduce((s, l) => s + (l.split_percent > 0 ? l.split_percent : 1), 0);
  for (const line of splitLines) {
    const weight = line.split_percent > 0 ? line.split_percent : 1;
    const share = totalSplitWeight > 0 ? weight / totalSplitWeight : 0;
    let amt = Math.round(poolRemaining * share);
    const mult = line.trainee_multiplier > 0 ? line.trainee_multiplier : 1;
    amt = Math.round(amt * mult);
    if (line.is_lead) amt += Math.round(amt * (line.lead_bonus_percent / 100));
    amt += line.flat_bonus_cents;
    payouts.push({
      id: line.id,
      name: line.name,
      amount_cents: amt,
      detail: `Split ${(share * 100).toFixed(0)}% of pool`,
    });
  }

  const totalPct = pctLines.reduce((s, l) => s + Math.max(0, l.split_percent), 0);
  const pctDenom = totalPct > 0 ? totalPct : pctLines.length || 1;
  for (const line of pctLines) {
    const pct = line.split_percent > 0 ? line.split_percent : 100 / pctDenom;
    let amt = Math.round(poolRemaining * (pct / 100));
    const mult = line.trainee_multiplier > 0 ? line.trainee_multiplier : 1;
    amt = Math.round(amt * mult);
    if (line.is_lead) amt += Math.round(amt * (line.lead_bonus_percent / 100));
    amt += line.flat_bonus_cents;
    payouts.push({
      id: line.id,
      name: line.name,
      amount_cents: amt,
      detail: `${pct.toFixed(0)}% of labor pool`,
    });
  }

  const total_labor_payout_cents = payouts.reduce((s, p) => s + p.amount_cents, 0);
  const unallocated_labor_cents = labor_pool_cents - total_labor_payout_cents;

  return {
    revenue_cents,
    expense_cents,
    labor_pool_cents,
    business_profit_cents,
    profit_margin_percent,
    labor_percent,
    payouts,
    total_labor_payout_cents,
    unallocated_labor_cents,
  };
}

export function payoutLineFromCrewAssignment(
  a: CrewAssignment,
  index: number,
  defaults?: {
    pay_type?: PayTypeValue;
    pay_rate_cents?: number;
    pay_percent?: number;
    lead_bonus_percent?: number;
    trainee_multiplier?: number;
  },
): PayoutLineInput {
  return {
    id: `crew-${index}`,
    name: a.name,
    pay_type: (a.pay_type as PayTypeValue) ?? defaults?.pay_type ?? "split",
    pay_rate_cents: a.pay_rate_cents ?? defaults?.pay_rate_cents ?? 0,
    hours: a.hours ?? 0,
    split_percent: a.split_percent ?? defaults?.pay_percent ?? 0,
    is_lead: Boolean(a.is_lead),
    trainee_multiplier: a.trainee_multiplier ?? defaults?.trainee_multiplier ?? 1,
    flat_bonus_cents: a.flat_bonus_cents ?? 0,
    lead_bonus_percent: a.lead_bonus_percent ?? defaults?.lead_bonus_percent ?? 10,
  };
}

export function payoutLineFromMember(m: {
  id: string;
  full_name: string;
  default_pay_type: string;
  default_pay_rate_cents: number;
  default_pay_percent: number;
  lead_bonus_percent: number;
  trainee_pay_multiplier: number;
  role: string;
}): PayoutLineInput {
  const isTrainee = m.role === "trainee";
  return {
    id: m.id,
    name: m.full_name,
    pay_type: m.default_pay_type as PayTypeValue,
    pay_rate_cents: m.default_pay_rate_cents,
    hours: 0,
    split_percent: Number(m.default_pay_percent) || 0,
    is_lead: m.role === "lead_tech",
    trainee_multiplier: isTrainee ? Number(m.trainee_pay_multiplier) || 0.75 : 1,
    flat_bonus_cents: 0,
    lead_bonus_percent: Number(m.lead_bonus_percent) || 10,
  };
}
