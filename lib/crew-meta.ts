/**
 * Optional `crew_members.performance_meta` fields used by PBPP Operations.
 * Keeps roster extensible without schema churn (avatars, skills, visibility, future permissions).
 */

export const ASSIGNMENT_VISIBILITY = [
  { value: "full", label: "Full — roster & assignment summary" },
  { value: "roster_only", label: "Roster only — hide active job count on roster card" },
  { value: "internal", label: "Internal — reserved for restricted dispatch views" },
] as const;

export type AssignmentVisibilityValue = (typeof ASSIGNMENT_VISIBILITY)[number]["value"];

const VIS_SET = new Set<string>(ASSIGNMENT_VISIBILITY.map((v) => v.value));

export function normalizeAssignmentVisibility(raw: unknown): AssignmentVisibilityValue {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (VIS_SET.has(v)) return v as AssignmentVisibilityValue;
  return "full";
}

export function crewSkillsFromMeta(meta: Record<string, unknown>): string[] {
  const s = meta.skills;
  if (!Array.isArray(s)) return [];
  return s.map((x) => String(x).trim()).filter(Boolean);
}

export function crewDisplayRolesFromMeta(meta: Record<string, unknown>): string[] {
  const d = meta.display_roles;
  if (!Array.isArray(d)) return [];
  return d.map((x) => String(x).trim()).filter(Boolean);
}

export function crewAvatarUrlFromMeta(meta: Record<string, unknown>): string | null {
  const u = meta.avatar_url;
  if (typeof u !== "string") return null;
  const t = u.trim();
  if (!t) return null;
  try {
    const parsed = new URL(t);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return t;
  } catch {
    return null;
  }
  return null;
}

/** When false, roster cards avoid surfacing how many active jobs match this person. */
export function crewShowAssignmentSummary(meta: Record<string, unknown>): boolean {
  return normalizeAssignmentVisibility(meta.assignment_visibility) === "full";
}

export function crewPermissionsFromMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const p = meta.permissions;
  if (p && typeof p === "object" && !Array.isArray(p)) return { ...(p as Record<string, unknown>) };
  return {};
}

export function skillsTextFromList(skills: string[]): string {
  return skills.join("\n");
}

export function displayRolesTextFromList(roles: string[]): string {
  return roles.join("\n");
}

export function parseSkillsTextarea(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseDisplayRolesTextarea(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parsePermissionsJson(text: string): Record<string, unknown> | null {
  const t = text.trim();
  if (!t) return {};
  try {
    const v = JSON.parse(t) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}
