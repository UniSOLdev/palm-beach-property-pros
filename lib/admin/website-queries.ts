import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";
import {
  mapWebsiteGalleryRow,
  mapWebsiteHomepageRow,
  mapWebsiteProjectRow,
  mapWebsiteReviewRow,
} from "@/lib/admin/website-mappers";
import { websiteGalleryDemo, websiteReviewsDemo } from "@/lib/admin/website-seed";
import type { WebsiteGalleryItem, WebsiteHomepageContent, WebsiteProject, WebsiteReview } from "@/lib/admin/website-types";

function logDb(context: string, err: unknown) {
  console.error(`[pbpp-db] ${context}`, err);
}

/** PostgREST: relation not in schema (migration not applied yet). */
function isMissingWebsiteTable(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "PGRST205";
}

export async function listWebsiteGalleryItemsAdmin(): Promise<WebsiteGalleryItem[]> {
  if (!isSupabaseServerConfigured()) return [...websiteGalleryDemo];
  const sb = createSupabaseAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("website_gallery_items")
    .select("*")
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error && !isMissingWebsiteTable(error)) logDb("listWebsiteGalleryItemsAdmin", error);
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapWebsiteGalleryRow);
}

/** Marketing homepage: prefer live featured items; fall back to curated demo when none. */
export async function listWebsiteGalleryMarketingPreview(): Promise<WebsiteGalleryItem[]> {
  if (!isSupabaseServerConfigured()) return websiteGalleryDemo.filter((g) => g.featured).slice(0, 6);
  const sb = createSupabaseAdminClient();
  if (!sb) return websiteGalleryDemo.filter((g) => g.featured).slice(0, 6);
  const { data, error } = await sb
    .from("website_gallery_items")
    .select("*")
    .eq("archived", false)
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .limit(6);
  if (error) {
    if (!isMissingWebsiteTable(error)) logDb("listWebsiteGalleryMarketingPreview", error);
    return websiteGalleryDemo.filter((g) => g.featured).slice(0, 6);
  }
  if (!data?.length) return websiteGalleryDemo.filter((g) => g.featured).slice(0, 6);
  return (data as Record<string, unknown>[]).map(mapWebsiteGalleryRow);
}

export async function listWebsiteReviewsAdmin(): Promise<WebsiteReview[]> {
  if (!isSupabaseServerConfigured()) return [...websiteReviewsDemo];
  const sb = createSupabaseAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("website_reviews")
    .select("*")
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error && !isMissingWebsiteTable(error)) logDb("listWebsiteReviewsAdmin", error);
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapWebsiteReviewRow);
}

export async function listWebsiteReviewsMarketingPreview(): Promise<WebsiteReview[]> {
  if (!isSupabaseServerConfigured()) return websiteReviewsDemo.filter((r) => r.featured).slice(0, 4);
  const sb = createSupabaseAdminClient();
  if (!sb) return websiteReviewsDemo.filter((r) => r.featured).slice(0, 4);
  const { data, error } = await sb
    .from("website_reviews")
    .select("*")
    .eq("archived", false)
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .limit(4);
  if (error) {
    if (!isMissingWebsiteTable(error)) logDb("listWebsiteReviewsMarketingPreview", error);
    return websiteReviewsDemo.filter((r) => r.featured).slice(0, 4);
  }
  if (!data?.length) return websiteReviewsDemo.filter((r) => r.featured).slice(0, 4);
  return (data as Record<string, unknown>[]).map(mapWebsiteReviewRow);
}

export async function getWebsiteHomepageRow(): Promise<WebsiteHomepageContent | null> {
  if (!isSupabaseServerConfigured()) return null;
  const sb = createSupabaseAdminClient();
  if (!sb) return null;
  const { data, error } = await sb.from("website_homepage_content").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) {
    if (error && !isMissingWebsiteTable(error)) logDb("getWebsiteHomepageRow", error);
    return null;
  }
  return mapWebsiteHomepageRow(data as Record<string, unknown>);
}

export async function listWebsiteProjectsAdmin(): Promise<WebsiteProject[]> {
  if (!isSupabaseServerConfigured()) return [];
  const sb = createSupabaseAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("website_projects")
    .select("*")
    .eq("archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error && !isMissingWebsiteTable(error)) logDb("listWebsiteProjectsAdmin", error);
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapWebsiteProjectRow);
}
