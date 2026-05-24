"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listMediaAssets as queryMediaAssets } from "@/lib/supabase/queries/media";
import type { MediaAssetRow } from "@/lib/supabase/queries/media";

export type { MediaAssetRow };

export async function listMediaAssets(options?: {
  folderId?: string;
  search?: string;
  sort?: "newest" | "oldest" | "name";
  limit?: number;
}) {
  const supabase = await createClient();
  const result = await queryMediaAssets(supabase, options);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export async function updateMediaAsset(
  id: string,
  patch: Partial<
    Pick<
      MediaAssetRow,
      | "title"
      | "alt_text"
      | "caption"
      | "tags"
      | "service_category"
      | "city"
      | "job_reference"
      | "before_after_group"
      | "before_after_role"
      | "is_featured"
      | "collection_id"
    >
  >,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("media_assets").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/website/media");
}

export async function deleteMediaAsset(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/website/media");
}

export async function suggestAltText(title: string, serviceCategory?: string | null) {
  const base = title.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
  const category = serviceCategory?.trim();
  if (category && base) return `${category} — ${base} | Palm Beach Property Pros`;
  if (base) return `${base} | Palm Beach Property Pros property service photo`;
  return "Palm Beach Property Pros property service photo";
}

export async function suggestCaption(title: string, city?: string | null) {
  const base = title.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
  if (city && base) return `${base} — ${city}, FL`;
  return base || "Project photo";
}
