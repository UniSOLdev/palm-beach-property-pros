"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const disabled = searchParams.get("disabled") === "1";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        return;
      }
      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl ring-1 ring-white/[0.06] backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-400/90">
          PBPP Operations
        </p>
        <h1 className="mt-2 text-xl font-semibold text-white">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">Property operations console</p>

        {disabled ? (
          <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Admin login is disabled until <code className="text-amber-50">ADMIN_PASSWORD</code> is
            set in the environment.
          </p>
        ) : null}

        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/45"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-sky-500/90 py-3 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-900/30 hover:bg-sky-400 disabled:opacity-40"
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07090d] text-zinc-500">
          Loading…
        </div>
      }
    >
      <AdminLoginInner />
    </Suspense>
  );
}
