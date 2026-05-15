import { createServiceSupabase } from "@/lib/supabase/service";
import type { CmsHomeSection, CmsSeoPublished, CmsSiteShellPublished, CmsThemePublished } from "@/lib/cms-types";
import {
  getSeoEntry,
  parseCmsHomeSections,
  parseSeoPublished,
  parseSiteShellPublished,
  parseThemePublished,
} from "@/lib/cms-parsers";

export async function getPublishedHomepageSections(): Promise<CmsHomeSection[] | null> {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_homepage")
      .select("published_sections")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return parseCmsHomeSections(data?.published_sections);
  } catch {
    return null;
  }
}

export async function getDraftHomepageSections(): Promise<CmsHomeSection[] | null> {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_homepage").select("draft_sections").eq("id", 1).maybeSingle();
    if (error) throw error;
    return parseCmsHomeSections(data?.draft_sections);
  } catch {
    return null;
  }
}

export async function getPublishedSiteShell(): Promise<CmsSiteShellPublished | null> {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_site_shell").select("published").eq("id", 1).maybeSingle();
    if (error) throw error;
    return parseSiteShellPublished(data?.published);
  } catch {
    return null;
  }
}

export async function getPublishedTheme(): Promise<CmsThemePublished | null> {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_theme").select("published").eq("id", 1).maybeSingle();
    if (error) throw error;
    return parseThemePublished(data?.published);
  } catch {
    return null;
  }
}

export async function getPublishedSeoMap(): Promise<CmsSeoPublished | null> {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_seo").select("published").eq("id", 1).maybeSingle();
    if (error) throw error;
    return parseSeoPublished(data?.published);
  } catch {
    return null;
  }
}

export async function getPublishedSeoForKey(key: string) {
  const map = await getPublishedSeoMap();
  return getSeoEntry(map, key);
}

export async function getPublishedServiceOverlay(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_service_overrides")
      .select("published")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    const p = data?.published;
    if (p && typeof p === "object" && !Array.isArray(p)) return p as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}
