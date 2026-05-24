import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { toQueryResult } from "@/lib/supabase/queries/client";
import { QUOTE_WITH_CLIENT } from "@/lib/supabase/queries/selectors";

type Db = SupabaseClient<Database>;

export type QuoteApprovalStatus = "pending" | "viewed" | "signed" | "declined";

export async function listQuotes(supabase: Db) {
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_WITH_CLIENT)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  return toQueryResult(data ?? [], error, { route: "/admin/quotes", query: "quotes list" });
}

export async function getQuoteWithItems(supabase: Db, id: string) {
  const [quoteRes, itemsRes, eventsRes] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).maybeSingle(),
    supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order"),
    supabase.from("quote_events").select("*").eq("quote_id", id).order("created_at", { ascending: false }),
  ]);

  if (quoteRes.error) {
    return toQueryResult(null, quoteRes.error, { route: "/admin/quotes", query: "quote detail" });
  }
  if (!quoteRes.data) {
    return { ok: false, error: "Record not found.", code: "PGRST116" };
  }

  return toQueryResult(
    {
      quote: quoteRes.data,
      items: itemsRes.data ?? [],
      events: eventsRes.data ?? [],
    },
    itemsRes.error ?? eventsRes.error,
    { route: "/admin/quotes", query: "quote detail with items" },
  );
}
