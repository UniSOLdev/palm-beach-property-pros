import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { toQueryResult } from "@/lib/supabase/queries/client";
import { CREW_LIST, CREW_OPTIONS } from "@/lib/supabase/queries/selectors";

type Db = SupabaseClient<Database>;

export type CrewMemberRow = Database["public"]["Tables"]["crew_members"]["Row"];
export type CrewOption = Pick<CrewMemberRow, "id" | "name">;

export async function listCrewMembers(supabase: Db, options?: { includeArchived?: boolean }) {
  let query = supabase.from("crew_members").select(CREW_LIST).order("name");
  if (!options?.includeArchived) query = query.eq("archived", false);
  const { data, error } = await query;
  return toQueryResult(data ?? [], error, { route: "/admin/crew", query: "crew_members list" });
}

export async function listCrewOptions(supabase: Db) {
  const { data, error } = await supabase
    .from("crew_members")
    .select(CREW_OPTIONS)
    .eq("archived", false)
    .order("name");
  return toQueryResult((data ?? []) as CrewOption[], error, { route: "crew", query: "crew options" });
}
