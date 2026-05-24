import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { toQueryResult } from "@/lib/supabase/queries/client";
import { LEAD_LIST } from "@/lib/supabase/queries/selectors";

type Db = SupabaseClient<Database>;

export type QuoteRequestRow = Database["public"]["Tables"]["quote_requests"]["Row"];

/** Normalize photo_urls jsonb to string array. */
export function parsePhotoUrls(value: QuoteRequestRow["photo_urls"]): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

export async function listQuoteRequests(
  supabase: Db,
  filters?: { status?: string; search?: string; archived?: boolean },
) {
  let query = supabase.from("quote_requests").select(LEAD_LIST).order("created_at", { ascending: false });

  if (filters?.archived === false || filters?.archived === undefined) {
    query = query.eq("archived", false);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(
      `name.ilike.${q},phone.ilike.${q},service_requested.ilike.${q},address.ilike.${q},city.ilike.${q}`,
    );
  }

  const { data, error } = await query;
  return toQueryResult(data ?? [], error, { route: "/admin/leads", query: "quote_requests list" });
}

export async function getQuoteRequestById(supabase: Db, id: string) {
  const { data, error } = await supabase.from("quote_requests").select("*").eq("id", id).maybeSingle();
  return toQueryResult(data, error, { route: "/admin/leads", query: "quote_requests by id" });
}
