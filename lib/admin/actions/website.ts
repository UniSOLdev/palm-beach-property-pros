"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function requireSb() {
  const sb = createSupabaseAdminClient();
  if (!sb) return { ok: false as const, error: "Supabase is not configured." };
  return { ok: true as const, sb };
}

function splitLinesOrComma(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createWebsiteGalleryItemAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/website/gallery/new?err=${encodeURIComponent(gate.error)}`);
  const id = randomUUID();
  const payload = {
    id,
    image_url: String(formData.get("image_url") ?? "").trim(),
    before_image_url: String(formData.get("before_image_url") ?? "").trim() || null,
    after_image_url: String(formData.get("after_image_url") ?? "").trim() || null,
    caption: String(formData.get("caption") ?? "").trim() || null,
    service_type: String(formData.get("service_type") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    job_name: String(formData.get("job_name") ?? "").trim() || null,
    featured: String(formData.get("featured") ?? "") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    archived: false,
  };
  if (!payload.image_url) redirect(`/admin/website/gallery/new?err=${encodeURIComponent("Image URL is required.")}`);
  const { error } = await gate.sb.from("website_gallery_items").insert(payload);
  if (error) redirect(`/admin/website/gallery/new?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/website/gallery");
  revalidatePath("/admin/website");
  revalidatePath("/");
  redirect("/admin/website/gallery?saved=1");
}

export async function archiveWebsiteGalleryItemAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/website/gallery?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/website/gallery?err=${encodeURIComponent("Missing id.")}`);
  const { error } = await gate.sb.from("website_gallery_items").update({ archived: true, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/website/gallery?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/website/gallery");
  revalidatePath("/");
  redirect("/admin/website/gallery?archived=1");
}

export async function createWebsiteReviewAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/website/reviews/new?err=${encodeURIComponent(gate.error)}`);
  const id = randomUUID();
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5) || 5));
  const payload = {
    id,
    customer_name: String(formData.get("customer_name") ?? "").trim(),
    rating,
    review_text: String(formData.get("review_text") ?? "").trim() || null,
    service_type: String(formData.get("service_type") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    source: String(formData.get("source") ?? "").trim() || null,
    featured: String(formData.get("featured") ?? "") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    archived: false,
  };
  if (!payload.customer_name) redirect(`/admin/website/reviews/new?err=${encodeURIComponent("Customer name is required.")}`);
  const { error } = await gate.sb.from("website_reviews").insert(payload);
  if (error) redirect(`/admin/website/reviews/new?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/website/reviews");
  revalidatePath("/admin/website");
  revalidatePath("/");
  redirect("/admin/website/reviews?saved=1");
}

export async function archiveWebsiteReviewAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/website/reviews?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/website/reviews?err=${encodeURIComponent("Missing id.")}`);
  const { error } = await gate.sb.from("website_reviews").update({ archived: true, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/website/reviews?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/website/reviews");
  revalidatePath("/");
  redirect("/admin/website/reviews?archived=1");
}

export async function saveWebsiteHomepageAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/website/homepage?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    hero_eyebrow: String(formData.get("hero_eyebrow") ?? "").trim() || null,
    hero_headline: String(formData.get("hero_headline") ?? "").trim() || null,
    hero_subheadline: String(formData.get("hero_subheadline") ?? "").trim() || null,
    primary_cta_text: String(formData.get("primary_cta_text") ?? "").trim() || null,
    primary_cta_link: String(formData.get("primary_cta_link") ?? "").trim() || null,
    secondary_cta_text: String(formData.get("secondary_cta_text") ?? "").trim() || null,
    secondary_cta_link: String(formData.get("secondary_cta_link") ?? "").trim() || null,
    trust_badges: splitLinesOrComma(String(formData.get("trust_badges") ?? "")),
    updated_at: new Date().toISOString(),
  };
  if (id) {
    const { error } = await gate.sb.from("website_homepage_content").update(payload).eq("id", id);
    if (error) redirect(`/admin/website/homepage?err=${encodeURIComponent(error.message)}`);
  } else {
    const newId = randomUUID();
    const { error } = await gate.sb.from("website_homepage_content").insert({ id: newId, ...payload });
    if (error) redirect(`/admin/website/homepage?err=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/admin/website/homepage");
  revalidatePath("/admin/website");
  revalidatePath("/");
  redirect("/admin/website/homepage?saved=1");
}
