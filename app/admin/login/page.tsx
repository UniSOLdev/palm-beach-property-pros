"use client";

import { createClient } from "@/lib/supabase/client";
import { safeAdminRedirectPath } from "@/lib/admin/safe-redirect";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeAdminRedirectPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-[70vh] items-center">
      <form onSubmit={onSubmit} className="admin-card w-full space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ocean">PBPP Admin</p>
        <h1 className="text-2xl font-bold text-navy">Sign in</h1>
        <p className="text-sm text-charcoal/70">Operations platform for field and office workflows.</p>
        <label className="block text-sm font-medium text-navy">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="admin-input"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={loading} className="admin-btn w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
