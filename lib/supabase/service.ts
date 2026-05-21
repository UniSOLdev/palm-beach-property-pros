import { createClient } from "@supabase/supabase-js";

function requireSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Add it to the server environment before using PBPP operations data.");
  }

  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Server-side admin routes require the service role key.");
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("supabase") && !parsed.hostname.includes("localhost")) {
      throw new Error("Unexpected Supabase host");
    }
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL.");
  }

  if (key.startsWith("ey") === false && key.length < 40) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY appears invalid. Use the server-side service role key, not a public anon key.");
  }

  return { url, key };
}

export function createServiceSupabase() {
  const { url, key } = requireSupabaseEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "pbpp-operations" } },
  });
}
