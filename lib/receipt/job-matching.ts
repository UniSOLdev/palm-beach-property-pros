import { normalizeReceiptCategory } from "@/lib/admin/receipt-categories";

export type JobMatchCandidate = {
  id: string;
  label: string;
  service_type: string;
  address: string;
  job_date: string;
  status: string;
};

export type JobMatchInput = {
  vendor: string;
  expenseDate: string;
  category: string;
  rawText?: string | null;
  lineItems?: { description: string }[];
};

const RENTAL_VENDORS = /u-?haul|budget truck|penske|home depot truck|enterprise rent/i;
const FUEL_VENDORS = /shell|chevron|bp |wawa|sunoco|exxon|mobil|gas station/i;
const SUPPLY_VENDORS = /home depot|lowes|lowe's|harbor freight|sam's club|walmart|ace hardware/i;

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return 999;
  return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000));
}

function scoreJob(job: JobMatchCandidate, input: JobMatchInput): number {
  let score = 0;
  const vendor = input.vendor.toLowerCase();
  const raw = (input.rawText ?? "").toLowerCase();
  const addr = job.address.toLowerCase();
  const service = job.service_type.toLowerCase();

  const dayGap = daysBetween(job.job_date, input.expenseDate);
  if (dayGap === 0) score += 40;
  else if (dayGap <= 2) score += 28;
  else if (dayGap <= 7) score += 14;
  else if (dayGap <= 14) score += 6;

  if (job.status !== "completed" && job.status !== "cancelled") score += 12;

  if (addr && raw.includes(addr.slice(0, Math.min(12, addr.length)))) score += 25;

  const cat = normalizeReceiptCategory(input.category);
  if (cat === "Rentals" && RENTAL_VENDORS.test(vendor)) {
    if (/move|clean|turnover|vacate/i.test(service)) score += 20;
    score += 15;
  }
  if (cat === "Gas/Fuel" && FUEL_VENDORS.test(vendor)) score += 8;
  if ((cat === "Supplies" || cat === "Tools" || cat === "Equipment") && SUPPLY_VENDORS.test(vendor)) {
    score += 10;
  }

  if (/dump|landfill/i.test(vendor) && /dump|debris|haul/i.test(service + raw)) score += 18;

  for (const item of input.lineItems ?? []) {
    const d = item.description.toLowerCase();
    if (d && addr.includes(d.slice(0, 8))) score += 8;
  }

  return score;
}

export function suggestJobMatch(
  jobs: JobMatchCandidate[],
  input: JobMatchInput,
): { job_id: string; label: string; score: number } | null {
  if (!jobs.length) return null;

  const ranked = jobs
    .map((job) => ({
      job,
      score: scoreJob(job, input),
    }))
    .filter((r) => r.score >= 18)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 22) return null;

  return {
    job_id: best.job.id,
    label: best.job.label,
    score: best.score,
  };
}
