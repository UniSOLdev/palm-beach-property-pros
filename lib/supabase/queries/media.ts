import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { toQueryResult } from "@/lib/supabase/queries/client";
import { MEDIA_ASSET_LIST } from "@/lib/supabase/queries/selectors";

type Db = SupabaseClient<Database>;

export type MediaAssetRow = Database["public"]["Tables"]["media_assets"]["Row"];

export async function listMediaAssets(
  supabase: Db,
  options?: {
    folderId?: string;
    search?: string;
    sort?: "newest" | "oldest" | "name";
    limit?: number;
  },
) {
  let query = supabase.from("media_assets").select(MEDIA_ASSET_LIST);

  if (options?.folderId) query = query.eq("folder_id", options.folderId);
  if (options?.search?.trim()) {
    const q = `%${options.search.trim()}%`;
    query = query.or(`title.ilike.${q},alt_text.ilike.${q},caption.ilike.${q},city.ilike.${q}`);
  }

  switch (options?.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name":
      query = query.order("title", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(options?.limit ?? 120);
  return toQueryResult((data ?? []) as MediaAssetRow[], error, { route: "/admin/website/media", query: "media_assets list" });
}
