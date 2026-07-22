"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/admin/auth";
import type { SiteHomepageSettings, SiteTestimonial } from "@/lib/site-content/types";
import { parseJsonArray } from "@/lib/site-content/types";

export type HomepageInput = {
  hero_eyebrow: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_primary_cta_label: string;
  hero_secondary_cta_label: string;
  trust_microcopy: string;
  trust_statements: string[];
  service_area_content: string;
  closing_cta_headline: string;
  closing_cta_body: string;
  section_order: string[];
  section_visibility: Record<string, boolean>;
  hero_media_id?: string | null;
  featured_service_ids: string[];
  featured_project_ids: string[];
};

export type TestimonialInput = {
  quote: string;
  author: string;
  location?: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

export async function getAdminHomepageSettings(): Promise<SiteHomepageSettings | null> {
  const { supabase } = await requireOwnerRole();
  const { data, error } = await supabase
    .from("site_homepage_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: String(data.id),
    hero_eyebrow: String(data.hero_eyebrow),
    hero_headline: String(data.hero_headline),
    hero_subheadline: String(data.hero_subheadline ?? ""),
    hero_primary_cta_label: String(data.hero_primary_cta_label),
    hero_secondary_cta_label: String(data.hero_secondary_cta_label),
    trust_microcopy: String(data.trust_microcopy ?? ""),
    trust_statements: parseJsonArray(data.trust_statements),
    service_area_content: String(data.service_area_content ?? ""),
    closing_cta_headline: String(data.closing_cta_headline ?? ""),
    closing_cta_body: String(data.closing_cta_body ?? ""),
    section_order: parseJsonArray(data.section_order),
    section_visibility:
      typeof data.section_visibility === "object" && data.section_visibility !== null
        ? (data.section_visibility as Record<string, boolean>)
        : {},
    hero_media_id: (data.hero_media_id as string) ?? null,
    featured_service_ids: Array.isArray(data.featured_service_ids)
      ? (data.featured_service_ids as string[])
      : [],
    featured_project_ids: Array.isArray(data.featured_project_ids)
      ? (data.featured_project_ids as string[])
      : [],
  };
}

export async function saveHomepageSettings(input: HomepageInput) {
  const { supabase } = await requireOwnerRole();

  const row = {
    hero_eyebrow: input.hero_eyebrow.trim(),
    hero_headline: input.hero_headline.trim(),
    hero_subheadline: input.hero_subheadline.trim(),
    hero_primary_cta_label: input.hero_primary_cta_label.trim(),
    hero_secondary_cta_label: input.hero_secondary_cta_label.trim(),
    trust_microcopy: input.trust_microcopy.trim(),
    trust_statements: input.trust_statements.filter(Boolean),
    service_area_content: input.service_area_content.trim(),
    closing_cta_headline: input.closing_cta_headline.trim(),
    closing_cta_body: input.closing_cta_body.trim(),
    section_order: input.section_order,
    section_visibility: input.section_visibility,
    hero_media_id: input.hero_media_id ?? null,
    featured_service_ids: input.featured_service_ids,
    featured_project_ids: input.featured_project_ids,
    updated_at: new Date().toISOString(),
  };

  const existing = await getAdminHomepageSettings();
  if (existing?.id) {
    const { error } = await supabase.from("site_homepage_settings").update(row).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("site_homepage_settings").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/site/homepage");
  revalidatePath("/");
}

export async function listAdminTestimonials(): Promise<SiteTestimonial[]> {
  const { supabase } = await requireOwnerRole();
  const { data, error } = await supabase
    .from("site_testimonials")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    quote: String(row.quote),
    author: String(row.author ?? ""),
    location: (row.location as string) ?? null,
    is_featured: Boolean(row.is_featured),
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order ?? 0),
  }));
}

export async function saveTestimonial(input: TestimonialInput, id?: string) {
  const { supabase } = await requireOwnerRole();
  const row = {
    quote: input.quote.trim(),
    author: input.author.trim(),
    location: input.location?.trim() || null,
    is_featured: input.is_featured,
    is_active: input.is_active,
    sort_order: input.sort_order,
  };

  if (id) {
    const { error } = await supabase.from("site_testimonials").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("site_testimonials").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/site/homepage");
  revalidatePath("/");
}

export async function deleteTestimonial(id: string) {
  const { supabase } = await requireOwnerRole();
  const { error } = await supabase.from("site_testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/site/homepage");
  revalidatePath("/");
}

export async function getSiteDashboardStats() {
  const { supabase } = await requireOwnerRole();

  const [newLeads, followUp, publishedProjects, draftProjects, services, recentLeads] =
    await Promise.all([
      supabase
        .from("quote_requests")
        .select("id", { count: "exact", head: true })
        .eq("archived", false)
        .eq("status", "new"),
      supabase
        .from("quote_requests")
        .select("id", { count: "exact", head: true })
        .eq("archived", false)
        .in("status", ["new", "contacted", "site_visit_scheduled", "estimate_sent", "approved"]),
      supabase
        .from("site_projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("site_projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", false),
      supabase.from("site_services").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("quote_requests")
        .select("id, name, service_requested, services_requested, status, created_at")
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return {
    newLeads: newLeads.count ?? 0,
    followUpLeads: followUp.count ?? 0,
    publishedProjects: publishedProjects.count ?? 0,
    draftProjects: draftProjects.count ?? 0,
    activeServices: services.count ?? 0,
    recentLeads: recentLeads.data ?? [],
  };
}
