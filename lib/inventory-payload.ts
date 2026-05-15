import {
  normalizeInventoryType,
  normalizeOperationalStatus,
  normalizePriorityLevel,
  priorityRankForLevel,
} from "@/lib/inventory-constants";

export type InventoryPayload = {
  name: string;
  category: string;
  inventory_type: string;
  operational_status: string;
  quantity: number;
  unit: string;
  storage_location: string | null;
  reorder_level: number;
  unit_cost_cents: number;
  vendor: string | null;
  notes: string | null;
  assigned_crew: string | null;
  assigned_job_id: string | null;
  last_restocked: string | null;
  condition: string | null;
  is_consumable: boolean;
  priority_level: string;
  priority_rank: number;
  meta: Record<string, unknown>;
};

function num(raw: unknown, fallback = 0): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

function bool(raw: unknown, fallback: boolean): boolean {
  if (typeof raw === "boolean") return raw;
  if (raw === "true" || raw === "1" || raw === 1) return true;
  if (raw === "false" || raw === "0" || raw === 0) return false;
  return fallback;
}

export function parseInventoryPayload(body: Record<string, unknown>): { ok: true; data: InventoryPayload } | { ok: false; error: string } {
  const name = str(body.name);
  if (!name) return { ok: false, error: "Name is required." };

  const category = str(body.category) ?? "General";
  const inventory_type = normalizeInventoryType(String(body.inventory_type ?? "consumable"));
  const operational_status = normalizeOperationalStatus(String(body.operational_status ?? "ready"));
  const priority_level = normalizePriorityLevel(String(body.priority_level ?? "normal"));
  const priority_rank = priorityRankForLevel(priority_level);

  const quantity = Math.max(0, num(body.quantity, 0));
  const reorder_level = Math.max(0, num(body.reorder_level, 0));
  const unit_cost_cents = Math.max(0, Math.round(num(body.unit_cost_cents, 0)));

  const unit = str(body.unit) ?? "each";
  const storage_location = str(body.storage_location);
  const vendor = str(body.vendor);
  const notes = str(body.notes);
  const assigned_crew = str(body.assigned_crew);
  const assigned_job_id = str(body.assigned_job_id);
  const last_restocked = str(body.last_restocked);
  const condition = str(body.condition);
  const is_consumable = bool(body.is_consumable, true);

  let meta: Record<string, unknown> = {};
  if (body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)) {
    meta = body.meta as Record<string, unknown>;
  }

  return {
    ok: true,
    data: {
      name,
      category,
      inventory_type,
      operational_status,
      quantity,
      unit,
      storage_location,
      reorder_level,
      unit_cost_cents,
      vendor,
      notes,
      assigned_crew,
      assigned_job_id,
      last_restocked,
      condition,
      is_consumable,
      priority_level,
      priority_rank,
      meta,
    },
  };
}
