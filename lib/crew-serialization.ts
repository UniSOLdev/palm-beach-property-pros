import type { CrewMemberRow } from "@/lib/db-types";

export function mapCrewMemberRow(data: Record<string, unknown>): CrewMemberRow {
  return {
    id: String(data.id),
    full_name: String(data.full_name ?? ""),
    role: String(data.role ?? "cleaning_tech"),
    status: String(data.status ?? "available"),
    skill_level: String(data.skill_level ?? "intermediate"),
    phone: data.phone != null ? String(data.phone) : null,
    email: data.email != null ? String(data.email) : null,
    notes: data.notes != null ? String(data.notes) : null,
    certifications: data.certifications != null ? String(data.certifications) : null,
    availability_notes: data.availability_notes != null ? String(data.availability_notes) : null,
    default_pay_type: String(data.default_pay_type ?? "percentage"),
    default_pay_rate_cents: Number(data.default_pay_rate_cents) || 0,
    default_pay_percent: Number(data.default_pay_percent) || 0,
    lead_bonus_percent: Number(data.lead_bonus_percent) || 10,
    trainee_pay_multiplier: Number(data.trainee_pay_multiplier) || 0.75,
    is_active: data.is_active !== false,
    performance_meta: (data.performance_meta && typeof data.performance_meta === "object"
      ? data.performance_meta
      : {}) as Record<string, unknown>,
    equipment_meta: (data.equipment_meta && typeof data.equipment_meta === "object"
      ? data.equipment_meta
      : {}) as Record<string, unknown>,
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? ""),
  };
}
