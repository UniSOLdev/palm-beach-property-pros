import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminEntityType, LifecycleAction } from "./types";

export async function logEntityActivity(
  supabase: SupabaseClient,
  input: {
    entityType: AdminEntityType;
    entityId: string;
    action: LifecycleAction | string;
    summary?: string;
    metadata?: Record<string, unknown>;
    userId?: string | null;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("admin_entity_activity").insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    summary: input.summary ?? null,
    metadata: input.metadata ?? {},
    created_by: input.userId ?? user?.id ?? null,
  });

  if (error) {
    console.warn("[PBPP Admin Activity]", error.message);
  }
}

export async function listEntityActivity(
  supabase: SupabaseClient,
  entityType: AdminEntityType,
  entityId: string,
  limit = 30,
) {
  const { data, error } = await supabase
    .from("admin_entity_activity")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
