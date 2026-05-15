import type { InventoryItemRow } from "@/lib/db-types";

export function mapInventoryItemRow(data: Record<string, unknown>): InventoryItemRow {
  return {
    id: String(data.id),
    name: String(data.name ?? ""),
    category: String(data.category ?? "General"),
    inventory_type: String(data.inventory_type ?? "consumable"),
    operational_status: String(data.operational_status ?? "ready"),
    quantity: Number(data.quantity) || 0,
    unit: String(data.unit ?? "each"),
    storage_location: data.storage_location != null ? String(data.storage_location) : null,
    reorder_level: Number(data.reorder_level) || 0,
    unit_cost_cents: Number(data.unit_cost_cents) || 0,
    vendor: data.vendor != null ? String(data.vendor) : null,
    notes: data.notes != null ? String(data.notes) : null,
    assigned_crew: data.assigned_crew != null ? String(data.assigned_crew) : null,
    assigned_job_id: data.assigned_job_id ? String(data.assigned_job_id) : null,
    last_restocked: data.last_restocked != null ? String(data.last_restocked).slice(0, 10) : null,
    condition: data.condition != null ? String(data.condition) : null,
    is_consumable: Boolean(data.is_consumable),
    priority_level: String(data.priority_level ?? "normal"),
    priority_rank: Number(data.priority_rank) || 2,
    meta: (data.meta && typeof data.meta === "object" ? data.meta : {}) as Record<string, unknown>,
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? ""),
  };
}
