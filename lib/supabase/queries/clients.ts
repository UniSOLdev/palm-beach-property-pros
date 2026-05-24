import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { toQueryResult } from "@/lib/supabase/queries/client";
import { CLIENT_LIST } from "@/lib/supabase/queries/selectors";

type Db = SupabaseClient<Database>;

export async function listClients(supabase: Db) {
  const { data, error } = await supabase.from("clients").select(CLIENT_LIST).eq("archived", false).order("name");
  return toQueryResult(data ?? [], error, { route: "/admin/clients", query: "clients list" });
}

export async function listClientOptions(supabase: Db) {
  const { data, error } = await supabase.from("clients").select("id, name").eq("archived", false).order("name");
  return toQueryResult(data ?? [], error, { route: "clients", query: "client options" });
}
