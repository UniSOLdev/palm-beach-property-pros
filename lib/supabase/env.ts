/**
 * Server-side Supabase configuration.
 * - Prefer SUPABASE_SERVICE_ROLE_KEY for admin operations (server only).
 * - Falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY only if the service role key is absent (RLS must allow writes).
 */
export function getSupabaseServerConfig(): {
  url: string;
  key: string;
  usesServiceRole: boolean;
} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = service ?? anon;
  if (!url || !key) return null;
  return { url, key, usesServiceRole: Boolean(service) };
}

export function isSupabaseServerConfigured(): boolean {
  return getSupabaseServerConfig() !== null;
}
