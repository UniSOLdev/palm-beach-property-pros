import {
  normalizeCrewRole,
  normalizeCrewStatus,
  normalizePayType,
  normalizeSkillLevel,
} from "@/lib/crew-constants";

export type CrewMemberPayload = {
  full_name: string;
  role: string;
  status: string;
  skill_level: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  certifications: string | null;
  availability_notes: string | null;
  default_pay_type: string;
  default_pay_rate_cents: number;
  default_pay_percent: number;
  lead_bonus_percent: number;
  trainee_pay_multiplier: number;
  is_active: boolean;
  performance_meta: Record<string, unknown>;
  equipment_meta: Record<string, unknown>;
};

function str(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

function num(raw: unknown, fallback = 0): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function bool(raw: unknown, fallback: boolean): boolean {
  if (typeof raw === "boolean") return raw;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return fallback;
}

export function parseCrewMemberPayload(
  body: Record<string, unknown>,
): { ok: true; data: CrewMemberPayload } | { ok: false; error: string } {
  const full_name = str(body.full_name);
  if (!full_name) return { ok: false, error: "Name is required." };

  let performance_meta: Record<string, unknown> = {};
  let equipment_meta: Record<string, unknown> = {};
  if (body.performance_meta && typeof body.performance_meta === "object" && !Array.isArray(body.performance_meta)) {
    performance_meta = body.performance_meta as Record<string, unknown>;
  }
  if (body.equipment_meta && typeof body.equipment_meta === "object" && !Array.isArray(body.equipment_meta)) {
    equipment_meta = body.equipment_meta as Record<string, unknown>;
  }

  return {
    ok: true,
    data: {
      full_name,
      role: normalizeCrewRole(String(body.role ?? "cleaning_tech")),
      status: normalizeCrewStatus(String(body.status ?? "available")),
      skill_level: normalizeSkillLevel(String(body.skill_level ?? "intermediate")),
      phone: str(body.phone),
      email: str(body.email),
      notes: str(body.notes),
      certifications: str(body.certifications),
      availability_notes: str(body.availability_notes),
      default_pay_type: normalizePayType(String(body.default_pay_type ?? "percentage")),
      default_pay_rate_cents: Math.max(0, Math.round(num(body.default_pay_rate_cents, 0))),
      default_pay_percent: Math.max(0, num(body.default_pay_percent, 0)),
      lead_bonus_percent: Math.max(0, num(body.lead_bonus_percent, 10)),
      trainee_pay_multiplier: Math.max(0.1, num(body.trainee_pay_multiplier, 0.75)),
      is_active: bool(body.is_active, true),
      performance_meta,
      equipment_meta,
    },
  };
}
