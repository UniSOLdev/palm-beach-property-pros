import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export function AdminDbBanner() {
  if (isSupabaseServerConfigured()) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-8">
      <div className="font-semibold">Demo data mode</div>
      <div className="mt-1 text-amber-900/80">
        Supabase is not configured. Set <code className="rounded bg-white/60 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-white/60 px-1">SUPABASE_SERVICE_ROLE_KEY</code> (server-only) to enable live operations
        data. The service role key must never be exposed to the browser.
      </div>
    </div>
  );
}
