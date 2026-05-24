"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatSiteStudioError } from "@/lib/cms/website-schemas";

export type WebsiteMediaRow = {
  id: string;
  page_id: string | null;
  section_id: string | null;
  storage_path: string;
  public_url: string;
  mime_type: string | null;
  alt_text: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  sort_order: number;
  created_at: string;
};

export async function listWebsiteMedia(pageId?: string) {
  const supabase = await createClient();
  let query = supabase.from("website_media").select("*").order("created_at", { ascending: false }).limit(100);
  if (pageId) query = query.eq("page_id", pageId);
  const { data, error } = await query;
  if (error) throw new Error(formatSiteStudioError(error.message));
  return (data ?? []) as WebsiteMediaRow[];
}

export async function registerWebsiteMedia(input: {
  pageId?: string;
  sectionId?: string;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  altText?: string;
  caption?: string;
  fileSizeBytes?: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("website_media")
    .insert({
      page_id: input.pageId ?? null,
      section_id: input.sectionId ?? null,
      storage_path: input.storagePath,
      public_url: input.publicUrl,
      mime_type: input.mimeType,
      alt_text: input.altText ?? null,
      caption: input.caption ?? null,
      file_size_bytes: input.fileSizeBytes ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(formatSiteStudioError(error.message));
  revalidatePath("/admin/website/media");
  return data as WebsiteMediaRow;
}

export async function deleteWebsiteMedia(id: string) {
  const supabase = await createClient();
  const { data: row } = await supabase.from("website_media").select("storage_path").eq("id", id).maybeSingle();
  if (row?.storage_path) {
    await supabase.storage.from("website-media").remove([row.storage_path]);
  }
  const { error } = await supabase.from("website_media").delete().eq("id", id);
  if (error) throw new Error(formatSiteStudioError(error.message));
  revalidatePath("/admin/website/media");
}
