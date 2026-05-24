import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";
import { logPipelineError } from "@/lib/pipeline/logger";

/** Server-only Supabase client — bypasses RLS for trusted server actions. Never import from client components. */
export function createServiceClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Returns null when service role env is missing (common production misconfiguration). */
export function tryCreateServiceClient() {
  try {
    return createServiceClient();
  } catch (error) {
    logPipelineError("service role client unavailable", error, { step: "tryCreateServiceClient" });
    return null;
  }
}

/** Anon client for SECURITY DEFINER RPC fallback when service role is unavailable. */
export function createServerAnonClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type SupabaseEnvStatus = {
  ok: boolean;
  missing: string[];
};

export function checkSupabaseEnv(): SupabaseEnvStatus {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return { ok: missing.length === 0, missing };
}
