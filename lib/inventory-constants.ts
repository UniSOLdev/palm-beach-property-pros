/** PBPP depot inventory — canonical values + UX helpers. */

export const INVENTORY_TYPES = [
  { value: "chemical", label: "Chemical" },
  { value: "consumable", label: "Consumable" },
  { value: "equipment", label: "Equipment" },
  { value: "tool", label: "Tool" },
  { value: "ppe", label: "PPE" },
  { value: "rental", label: "Rental" },
  { value: "mobile_ops_gear", label: "Mobile ops gear" },
] as const;

export type InventoryTypeValue = (typeof INVENTORY_TYPES)[number]["value"];

export const OPERATIONAL_STATUSES = [
  { value: "ready", label: "Ready" },
  { value: "needs_refill", label: "Needs refill" },
  { value: "assigned_to_job", label: "Assigned to job" },
  { value: "maintenance_needed", label: "Maintenance needed" },
  { value: "damaged", label: "Damaged" },
  { value: "missing", label: "Missing" },
  { value: "out_of_service", label: "Out of service" },
] as const;

export type OperationalStatusValue = (typeof OPERATIONAL_STATUSES)[number]["value"];

export const PRIORITY_LEVELS = [
  { value: "critical", label: "Critical", rank: 0 },
  { value: "high", label: "High", rank: 1 },
  { value: "normal", label: "Normal", rank: 2 },
  { value: "low", label: "Low", rank: 3 },
] as const;

export type PriorityLevelValue = (typeof PRIORITY_LEVELS)[number]["value"];

export const CONDITION_OPTIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "unknown", label: "Unknown" },
] as const;

export const STORAGE_LOCATION_PRESETS = [
  "Shelf A1",
  "Shelf A2",
  "Chemical rack",
  "Tool wall",
  "Upper shelf",
  "Lower shelf",
  "Vehicle bin",
  "Laundry area",
  "Overflow storage",
  "Mobile loadout",
] as const;

export const CATEGORY_GROUPS: { group: string; items: string[] }[] = [
  {
    group: "Chemicals",
    items: ["Cleaning chemicals", "Detailing chemicals", "Degreasers", "Glass cleaners"],
  },
  {
    group: "Consumables",
    items: ["Microfibers", "Gloves", "Trash bags", "Paper products", "Mop heads"],
  },
  {
    group: "Equipment",
    items: ["Vacuums", "Extractors", "Steamers", "Pressure washers", "Compressors", "Ladders"],
  },
  {
    group: "Ops gear",
    items: ["Canopy", "Extension cords", "Hose reels", "Pump sprayers", "Buckets"],
  },
  {
    group: "Rentals",
    items: ["Rug Doctor", "U-Haul", "Temporary equipment"],
  },
];

export const ALL_SUGGESTED_CATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.items);

const INVENTORY_TYPE_SET = new Set<string>(INVENTORY_TYPES.map((t) => t.value));
const STATUS_SET = new Set<string>(OPERATIONAL_STATUSES.map((s) => s.value));
const PRIORITY_SET = new Set<string>(PRIORITY_LEVELS.map((p) => p.value));

export function normalizeInventoryType(raw: string): InventoryTypeValue {
  const v = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (INVENTORY_TYPE_SET.has(v)) return v as InventoryTypeValue;
  return "consumable";
}

export function normalizeOperationalStatus(raw: string): OperationalStatusValue {
  const v = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (STATUS_SET.has(v)) return v as OperationalStatusValue;
  return "ready";
}

export function normalizePriorityLevel(raw: string): PriorityLevelValue {
  const v = raw.trim().toLowerCase();
  if (PRIORITY_SET.has(v)) return v as PriorityLevelValue;
  return "normal";
}

export function priorityRankForLevel(level: PriorityLevelValue): number {
  const row = PRIORITY_LEVELS.find((p) => p.value === level);
  return row?.rank ?? 2;
}

export function isLowStock(quantity: number, reorderLevel: number): boolean {
  return reorderLevel > 0 && quantity <= reorderLevel;
}

export function typeBadgeClasses(value: string): string {
  switch (value) {
    case "chemical":
      return "border-violet-400/35 bg-violet-500/15 text-violet-100";
    case "consumable":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
    case "equipment":
      return "border-sky-400/35 bg-sky-500/15 text-sky-100";
    case "tool":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    case "ppe":
      return "border-pink-400/30 bg-pink-500/10 text-pink-100";
    case "rental":
      return "border-orange-400/30 bg-orange-500/10 text-orange-100";
    case "mobile_ops_gear":
      return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
    default:
      return "border-white/15 bg-white/5 text-zinc-200";
  }
}

export function statusBadgeClasses(value: string): string {
  switch (value) {
    case "ready":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
    case "needs_refill":
      return "border-amber-400/35 bg-amber-500/15 text-amber-100";
    case "assigned_to_job":
      return "border-sky-400/35 bg-sky-500/15 text-sky-100";
    case "maintenance_needed":
      return "border-orange-400/35 bg-orange-500/15 text-orange-100";
    case "damaged":
    case "missing":
    case "out_of_service":
      return "border-rose-400/35 bg-rose-500/15 text-rose-100";
    default:
      return "border-white/15 bg-white/5 text-zinc-200";
  }
}

export function labelForInventoryType(value: string): string {
  return INVENTORY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function labelForOperationalStatus(value: string): string {
  return OPERATIONAL_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function labelForPriority(value: string): string {
  return PRIORITY_LEVELS.find((p) => p.value === value)?.label ?? value;
}
