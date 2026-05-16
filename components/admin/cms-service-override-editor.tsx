"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function CmsServiceOverrideEditor({ slug, initialDraft }: { slug: string; initialDraft: string }) {
  const router = useRouter();
  const [json, setJson] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const save = useCallback(async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        throw new Error("Invalid JSON");
      }
      const res = await fetch(`/api/admin/cms/service-overrides/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMsg("Draft saved.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }, [json, router, slug]);

  const publish = useCallback(async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/cms/service-overrides/${encodeURIComponent(slug)}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setMsg("Published. Public service page refreshes within ~2 minutes (ISR).");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }, [router, slug]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/website/services" className="text-xs font-semibold text-sky-300 no-underline hover:underline">
          ← All services
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded-xl bg-sky-500/90 px-4 py-2 text-xs font-semibold text-sky-950 disabled:opacity-40"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void publish()}
            className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-40"
          >
            Publish overlay
          </button>
          <Link
            href={`/services/${slug}`}
            target="_blank"
            className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-200 no-underline hover:bg-white/5"
          >
            View public page
          </Link>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Partial fields supported: <code className="text-zinc-400">name</code>, <code className="text-zinc-400">headline</code>
        , <code className="text-zinc-400">shortDescription</code>, <code className="text-zinc-400">authorityIntro</code>,{" "}
        <code className="text-zinc-400">included</code>, <code className="text-zinc-400">whoItsFor</code>,{" "}
        <code className="text-zinc-400">process</code>, <code className="text-zinc-400">startingPriceLabel</code>,{" "}
        <code className="text-zinc-400">faq</code> (array of <code className="text-zinc-400">q</code> /{" "}
        <code className="text-zinc-400">a</code>).
      </p>
      {err ? <p className="text-sm text-rose-200">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-200">{msg}</p> : null}
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        spellCheck={false}
        className="min-h-[420px] w-full rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-zinc-100 outline-none focus:border-sky-400/40"
      />
    </div>
  );
}
