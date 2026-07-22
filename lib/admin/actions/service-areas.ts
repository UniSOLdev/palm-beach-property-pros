"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/admin/auth";

export type ServiceAreaInput = {
  name: string;
  slug: string;
  area_type: "city" | "county" | "zip";
  county?: string | null;
  zip_codes?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  hero_headline?: string | null;
  body_content: string;
  is_active: boolean;
  sort_order: number;
};

export async function listServiceAreas() {
  const { supabase } = await requireOwnerRole();
  const { data, error } = await supabase
    .from("service_areas")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function saveServiceArea(input: ServiceAreaInput, id?: string) {
  const { supabase } = await requireOwnerRole();
  const row = {
    ...input,
    county: input.county ?? null,
    zip_codes: input.zip_codes ?? [],
    seo_title: input.seo_title ?? null,
    seo_description: input.seo_description ?? null,
    hero_headline: input.hero_headline ?? null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("service_areas").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("service_areas").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/site/service-areas");
  revalidatePath("/service-area");
  revalidatePath(`/service-area/${input.slug}`);
}

export async function getPublicServiceArea(slug: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_areas")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return null;
  return data;
}
