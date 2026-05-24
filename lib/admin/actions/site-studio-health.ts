"use server";

import { createClient } from "@/lib/supabase/server";
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

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      limit: (n: number) => Promise<{ error: { message: string } | null }>;
    };
    eq: (col: string, val: string) => {
      maybeSingle: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
    };
  };
};

async function probeTables(client: SupabaseLike) {
  const tables: Record<string, boolean> = {};
  let error: string | null = null;

  for (const table of REQUIRED_TABLES) {
    const { error: qErr } = await client.from(table).select("id").limit(1);
    tables[table] = !qErr;
    if (qErr && !error) error = formatSiteStudioError(qErr.message);
  }

  return { tables, error };
}

/** Check whether Site Studio tables exist and are queryable. */
export async function checkSiteStudioHealth(): Promise<SiteStudioHealth> {
  const base: SiteStudioHealth = {
    ready: false,
    tables: Object.fromEntries(REQUIRED_TABLES.map((t) => [t, false])),
    homepageId: null,
    error: null,
    migrationFile: MIGRATION_FILE,
  };

  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return { ...base, error: "Sign in required to use Site Studio." };
  }

  let probe = await probeTables(authClient as unknown as SupabaseLike);

  if (!REQUIRED_TABLES.every((t) => probe.tables[t])) {
    const service = tryCreateServiceClient();
    if (service) {
      probe = await probeTables(service as unknown as SupabaseLike);
    }
  }

  base.tables = probe.tables;
  base.error = probe.error;
  base.ready = REQUIRED_TABLES.every((t) => probe.tables[t]);

  if (base.ready) {
    const { data } = await authClient
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
  const supabase = tryCreateServiceClient() ?? (await createClient());
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
