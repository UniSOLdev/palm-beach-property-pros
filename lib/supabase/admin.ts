import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerConfig } from "./env";

export type AdminSupabase = SupabaseClient;

export function createSupabaseAdminClient(): AdminSupabase | null {
  const cfg = getSupabaseServerConfig();
  if (!cfg) return null;
  return createClient(cfg.url, cfg.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
