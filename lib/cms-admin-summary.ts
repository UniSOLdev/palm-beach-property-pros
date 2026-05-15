import { createServiceSupabase } from "@/lib/supabase/service";
import { homepageCompletionPercent } from "@/lib/cms-defaults";
import { parseCmsHomeSections } from "@/lib/cms-parsers";

export type CmsAdminSummary = {
  gallery: number;
  reviews: number;
  projects: number;
  service_areas: number;
  media: number;
  ctas: number;
  service_overrides: number;
  homepage_completion: number;
  seo_completion: number;
  last_homepage_update: string | null;
  last_homepage_publish: string | null;
  last_seo_update: string | null;
  last_shell_publish: string | null;
  last_theme_publish: string | null;
};

export async function loadCmsAdminSummary(): Promise<CmsAdminSummary> {
  const supabase = createServiceSupabase();
  const [
    homeRes,
    mediaRes,
    galleryRes,
    reviewsRes,
    projectsRes,
    areasRes,
    ctasRes,
    seoRes,
    shellRes,
    themeRes,
    svcRes,
  ] = await Promise.all([
    supabase.from("cms_homepage").select("draft_sections, published_sections, updated_at, published_at").eq("id", 1).maybeSingle(),
    supabase.from("cms_media_assets").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("cms_gallery_items").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("cms_reviews").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("cms_projects").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("cms_service_areas").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("cms_ctas").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("cms_seo").select("draft, published, updated_at").eq("id", 1).maybeSingle(),
    supabase.from("cms_site_shell").select("updated_at, published_at").eq("id", 1).maybeSingle(),
    supabase.from("cms_theme").select("updated_at, published_at").eq("id", 1).maybeSingle(),
    supabase.from("cms_service_overrides").select("slug", { count: "exact", head: true }),
  ]);

  const home = homeRes.data as Record<string, unknown> | null;
  const pub = parseCmsHomeSections(home?.published_sections);
  const draft = parseCmsHomeSections(home?.draft_sections);
  const homeComplete = homepageCompletionPercent(pub ?? draft ?? []);
  const seoMap = (seoRes.data as { published?: unknown } | null)?.published;
  const seoKeys = seoMap && typeof seoMap === "object" && !Array.isArray(seoMap) ? Object.keys(seoMap as object).length : 0;
  const seoComplete = Math.min(100, seoKeys * 20);

  return {
    gallery: galleryRes.count ?? 0,
    reviews: reviewsRes.count ?? 0,
    projects: projectsRes.count ?? 0,
    service_areas: areasRes.count ?? 0,
    media: mediaRes.count ?? 0,
    ctas: ctasRes.count ?? 0,
    service_overrides: svcRes.count ?? 0,
    homepage_completion: homeComplete,
    seo_completion: seoComplete,
    last_homepage_update: (home?.updated_at as string | undefined) ?? null,
    last_homepage_publish: (home?.published_at as string | undefined) ?? null,
    last_seo_update:
      seoRes.data && typeof seoRes.data === "object" ? (seoRes.data as { updated_at?: string }).updated_at ?? null : null,
    last_shell_publish:
      shellRes.data && typeof shellRes.data === "object" ? (shellRes.data as { published_at?: string }).published_at ?? null : null,
    last_theme_publish:
      themeRes.data && typeof themeRes.data === "object" ? (themeRes.data as { published_at?: string }).published_at ?? null : null,
  };
}
