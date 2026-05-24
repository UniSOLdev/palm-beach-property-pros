import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { toQueryResult } from "@/lib/supabase/queries/client";
import { WEBSITE_PAGE_LIST } from "@/lib/supabase/queries/selectors";

type Db = SupabaseClient<Database>;

export type WebsitePageRow = Database["public"]["Tables"]["website_pages"]["Row"];

export async function listWebsitePages(supabase: Db) {
  const { data, error } = await supabase
    .from("website_pages")
    .select(WEBSITE_PAGE_LIST)
    .order("updated_at", { ascending: false });
  return toQueryResult(data ?? [], error, { route: "/admin/website/pages", query: "website_pages list" });
}

export async function getWebsitePageById(supabase: Db, pageId: string) {
  const { data, error } = await supabase.from("website_pages").select("*").eq("id", pageId).maybeSingle();
  return toQueryResult(data, error, { route: "/admin/website/builder", query: "website_pages by id" });
}
