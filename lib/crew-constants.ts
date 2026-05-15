/** PBPP field crew — roles, statuses, pay structures. */

export const CREW_ROLES = [
  { value: "lead_tech", label: "Lead tech" },
  { value: "detail_tech", label: "Detail tech" },
  { value: "cleaning_tech", label: "Cleaning tech" },
  { value: "utility", label: "Utility" },
  { value: "pressure_washing_tech", label: "Pressure washing tech" },
  { value: "window_tech", label: "Window tech" },
  { value: "trainee", label: "Trainee" },
] as const;

export type CrewRoleValue = (typeof CREW_ROLES)[number]["value"];

export const CREW_STATUSES = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "on_job", label: "On job" },
  { value: "off_today", label: "Off today" },
  { value: "training", label: "Training" },
  { value: "inactive", label: "Inactive" },
] as const;

export type CrewStatusValue = (typeof CREW_STATUSES)[number]["value"];

export const SKILL_LEVELS = [
  { value: "trainee", label: "Trainee" },
  { value: "junior", label: "Junior" },
  { value: "intermediate", label: "Intermediate" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
] as const;

export const PAY_TYPES = [
  { value: "hourly", label: "Hourly" },
  { value: "flat", label: "Flat rate" },
  { value: "percentage", label: "% of labor pool" },
  { value: "split", label: "Even split" },
] as const;

export type PayTypeValue = (typeof PAY_TYPES)[number]["value"];

const ROLE_SET = new Set(CREW_ROLES.map((r) => r.value));
const STATUS_SET = new Set(CREW_STATUSES.map((s) => s.value));
const SKILL_SET = new Set(SKILL_LEVELS.map((s) => s.value));
const PAY_SET = new Set(PAY_TYPES.map((p) => p.value));

export function normalizeCrewRole(raw: string): CrewRoleValue {
  const v = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (ROLE_SET.has(v as CrewRoleValue)) return v as CrewRoleValue;
  return "cleaning_tech";
}

export function normalizeCrewStatus(raw: string): CrewStatusValue {
  const v = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (STATUS_SET.has(v as CrewStatusValue)) return v as CrewStatusValue;
  return "available";
}

export function normalizeSkillLevel(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (SKILL_SET.has(v as (typeof SKILL_LEVELS)[number]["value"])) return v;
  return "intermediate";
}

export function normalizePayType(raw: string): PayTypeValue {
  const v = raw.trim().toLowerCase();
  if (PAY_SET.has(v as PayTypeValue)) return v as PayTypeValue;
  return "percentage";
}

export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function statusBadgeClasses(status: string): string {
  switch (status) {
    case "available":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
    case "assigned":
    case "on_job":
      return "border-sky-400/35 bg-sky-500/15 text-sky-100";
    case "training":
      return "border-violet-400/30 bg-violet-500/10 text-violet-100";
    case "off_today":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    case "inactive":
      return "border-zinc-600 bg-zinc-800/60 text-zinc-400";
    default:
      return "border-white/15 bg-white/5 text-zinc-200";
  }
}

export function labelForRole(value: string): string {
  return CREW_ROLES.find((r) => r.value === value)?.label ?? value.replace(/_/g, " ");
}

export function labelForStatus(value: string): string {
  return CREW_STATUSES.find((s) => s.value === value)?.label ?? value.replace(/_/g, " ");
}

export function labelForPayType(value: string): string {
  return PAY_TYPES.find((p) => p.value === value)?.label ?? value;
}

export function marginToneClass(pct: number): string {
  if (pct >= 45) return "text-emerald-300";
  if (pct >= 25) return "text-sky-300";
  if (pct >= 10) return "text-amber-200";
  return "text-rose-300";
}
