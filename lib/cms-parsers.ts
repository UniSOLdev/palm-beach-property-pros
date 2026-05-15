import type { CmsHomeSection, CmsSeoEntry, CmsSeoPublished, CmsSiteShellPublished, CmsThemePublished } from "@/lib/cms-types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

export function parseCmsHomeSections(raw: unknown): CmsHomeSection[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: CmsHomeSection[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const type = String(item.type ?? "");
    const sortOrder = Number(item.sortOrder ?? item.sort_order ?? 0) || 0;
    const id = String(item.id ?? "").trim() || `${type}-${sortOrder}-${out.length}`;
    const visible = item.visible !== false;
    const data = isRecord(item.data) ? item.data : {};
    switch (type) {
      case "hero":
      case "portal_strip":
      case "property_care_plans":
      case "service_divisions":
      case "who_we_work_with":
      case "local_service_area":
      case "how_it_works":
      case "documentation_trust":
      case "faq_embed":
      case "footer_cta":
        out.push({ id, type, visible, sortOrder, data } as CmsHomeSection);
        break;
      default:
        break;
    }
  }
  return out.length ? out.sort((a, b) => a.sortOrder - b.sortOrder) : null;
}

export function parseSiteShellPublished(raw: unknown): CmsSiteShellPublished | null {
  if (!isRecord(raw)) return null;
  return raw as CmsSiteShellPublished;
}

export function parseThemePublished(raw: unknown): CmsThemePublished | null {
  if (!isRecord(raw)) return null;
  return raw as CmsThemePublished;
}

export function parseSeoPublished(raw: unknown): CmsSeoPublished | null {
  if (!isRecord(raw)) return null;
  return raw as CmsSeoPublished;
}

export function getSeoEntry(map: CmsSeoPublished | null, key: string): CmsSeoEntry | null {
  if (!map) return null;
  const e = map[key];
  return e && typeof e === "object" ? e : null;
}
