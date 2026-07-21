"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/admin/auth";
import type { PricingMode, SiteService } from "@/lib/site-content/types";
import { parseJsonArray } from "@/lib/site-content/types";

export type ServiceInput = {
  slug: string;
  title: string;
  short_description: string;
  headline: string;
  authority_intro: string;
  best_for: string;
  included: string[];
  add_ons: string[];
  who_its_for: string[];
  process_steps: string[];
  pricing_mode: PricingMode;
  pricing_label: string;
  cta_headline: string;
  cta_body: string;
  cover_image_url?: string | null;
  cover_media_id?: string | null;
  water_access_note?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  faqs: Array<{ question: string; answer: string; sort_order: number; id?: string }>;
};

function mapServiceRow(row: Record<string, unknown>): SiteService {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    short_description: String(row.short_description ?? ""),
    headline: String(row.headline ?? ""),
    authority_intro: String(row.authority_intro ?? ""),
    best_for: String(row.best_for ?? ""),
    included: parseJsonArray(row.included),
    add_ons: parseJsonArray(row.add_ons),
    who_its_for: parseJsonArray(row.who_its_for),
    process_steps: parseJsonArray(row.process_steps),
    pricing_mode: (row.pricing_mode as PricingMode) ?? "starting_at",
    pricing_label: String(row.pricing_label ?? ""),
    cta_headline: String(row.cta_headline ?? ""),
    cta_body: String(row.cta_body ?? ""),
    cover_image_url: (row.cover_image_url as string) ?? null,
    cover_media_id: (row.cover_media_id as string) ?? null,
    water_access_note: (row.water_access_note as string) ?? null,
    seo_title: (row.seo_title as string) ?? null,
    seo_description: (row.seo_description as string) ?? null,
    display_order: Number(row.display_order ?? 0),
    is_featured: Boolean(row.is_featured),
    is_active: Boolean(row.is_active),
  };
}

export async function listAdminServices(): Promise<SiteService[]> {
  const { supabase } = await requireOwnerRole();
  const { data, error } = await supabase
    .from("site_services")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapServiceRow(row as Record<string, unknown>));
}

export async function getAdminService(id: string) {
  const { supabase } = await requireOwnerRole();
  const { data, error } = await supabase.from("site_services").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Service not found");

  const { data: faqs } = await supabase
    .from("site_service_faqs")
    .select("*")
    .eq("service_id", id)
    .order("sort_order", { ascending: true });

  return {
    service: mapServiceRow(data as Record<string, unknown>),
    faqs: (faqs ?? []).map((f) => ({
      id: String(f.id),
      service_id: String(f.service_id),
      question: String(f.question),
      answer: String(f.answer),
      sort_order: Number(f.sort_order ?? 0),
    })),
  };
}

export async function saveService(input: ServiceInput, id?: string) {
  const { supabase } = await requireOwnerRole();

  const row = {
    slug: input.slug.trim(),
    title: input.title.trim(),
    short_description: input.short_description.trim(),
    headline: input.headline.trim(),
    authority_intro: input.authority_intro.trim(),
    best_for: input.best_for.trim(),
    included: input.included.filter(Boolean),
    add_ons: input.add_ons.filter(Boolean),
    who_its_for: input.who_its_for.filter(Boolean),
    process_steps: input.process_steps.filter(Boolean),
    pricing_mode: input.pricing_mode,
    pricing_label: input.pricing_label.trim(),
    cta_headline: input.cta_headline.trim(),
    cta_body: input.cta_body.trim(),
    cover_image_url: input.cover_image_url ?? null,
    cover_media_id: input.cover_media_id ?? null,
    water_access_note: input.water_access_note?.trim() || null,
    seo_title: input.seo_title?.trim() || null,
    seo_description: input.seo_description?.trim() || null,
    display_order: input.display_order,
    is_featured: input.is_featured,
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  };

  let serviceId = id;
  if (id) {
    const { error } = await supabase.from("site_services").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("site_services").insert(row).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Insert failed");
    serviceId = String(data.id);
  }

  if (!serviceId) throw new Error("Missing service id");

  await supabase.from("site_service_faqs").delete().eq("service_id", serviceId);
  if (input.faqs.length) {
    const { error: faqError } = await supabase.from("site_service_faqs").insert(
      input.faqs.map((f, i) => ({
        service_id: serviceId,
        question: f.question.trim(),
        answer: f.answer.trim(),
        sort_order: f.sort_order ?? i,
      })),
    );
    if (faqError) throw new Error(faqError.message);
  }

  revalidatePath("/admin/site/services");
  revalidatePath("/services");
  revalidatePath(`/services/${input.slug}`);
  return { id: serviceId };
}

export async function deleteService(id: string) {
  const { supabase } = await requireOwnerRole();
  const { error } = await supabase.from("site_services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/site/services");
  revalidatePath("/services");
}

export async function reorderServices(orderedIds: string[]) {
  const { supabase } = await requireOwnerRole();
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from("site_services").update({ display_order: i }).eq("id", orderedIds[i]);
  }
  revalidatePath("/admin/site/services");
  revalidatePath("/services");
}
