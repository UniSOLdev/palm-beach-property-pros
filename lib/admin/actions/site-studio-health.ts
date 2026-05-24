"use server";

import { tryCreateServiceClient } from "@/lib/supabase/service";
import { formatSiteStudioError } from "@/lib/cms/website-schemas";

export type SiteStudioHealth = {
  ready: boolean;
  tables: Record<string, boolean>;
  homepageId: string | null;
  error: string | null;
  migrationFile: string;
};

const REQUIRED_TABLES = [
  "website_pages",
  "website_sections",
  "website_media",
  "website_revisions",
  "website_theme",
] as const;

const MIGRATION_FILE = "supabase/migrations/20260527120000_site_studio_complete.sql";

/** Check whether Site Studio tables exist in production (service role). */
export async function checkSiteStudioHealth(): Promise<SiteStudioHealth> {
  const base: SiteStudioHealth = {
    ready: false,
    tables: Object.fromEntries(REQUIRED_TABLES.map((t) => [t, false])),
    homepageId: null,
    error: null,
    migrationFile: MIGRATION_FILE,
  };

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return {
      ...base,
      error: "SUPABASE_SERVICE_ROLE_KEY is not configured on this deployment.",
    };
  }

  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("id").limit(1);
    base.tables[table] = !error;
    if (error && !base.error) {
      base.error = formatSiteStudioError(error.message);
    }
  }

  base.ready = REQUIRED_TABLES.every((t) => base.tables[t]);

  if (base.ready) {
    const { data } = await supabase
      .from("website_pages")
      .select("id")
      .eq("slug", "home")
      .maybeSingle();
    base.homepageId = data?.id ?? null;
  }

  return base;
}

/** Ensure homepage row exists after migration (idempotent). */
export async function ensureSiteStudioHomepage(): Promise<string | null> {
  const supabase = tryCreateServiceClient();
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("website_pages")
    .select("id")
    .eq("slug", "home")
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("website_pages")
    .insert({
      slug: "home",
      title: "Homepage",
      page_type: "homepage",
      seo_title: "Palm Beach Property Pros | Premium Property Care",
      meta_description: "Residential, commercial, and coastal property services in Palm Beach County.",
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return null;
  return created.id;
}
