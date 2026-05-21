"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = { initialDraft: string };

export function CmsHomepageEditor({ initialDraft }: Props) {
  const router = useRouter();
  const [json, setJson] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const saveDraft = useCallback(async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        throw new Error("Invalid JSON — fix syntax before saving.");
      }
      const res = await fetch("/api/admin/cms/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_sections: parsed }),
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
  }, [json, router]);

  const publish = useCallback(async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/cms/homepage/publish", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setMsg(`Published (${data.section_count ?? "?"} sections). Live site updates within ~2 minutes (ISR).`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">Homepage builder</p>
          <h1 className="text-xl font-semibold text-white">Section JSON (draft)</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Edit the structured homepage document. Use{" "}
            <strong className="text-zinc-300">Bootstrap</strong> on the Website dashboard to load defaults from the
            current live site, then publish when ready. Preview always reflects the saved draft.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveDraft()}
            className="rounded-xl bg-sky-500/90 px-4 py-2 text-sm font-semibold text-sky-950 disabled:opacity-40"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void publish()}
            className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-40"
          >
            Publish live
          </button>
          <Link
            href="/admin/website/preview"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-200 no-underline hover:bg-white/5"
          >
            Open draft preview
          </Link>
        </div>
      </div>
      {err ? <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{err}</p> : null}
      {msg ? <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{msg}</p> : null}
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        spellCheck={false}
        className="min-h-[480px] w-full rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-zinc-100 outline-none focus:border-sky-400/40"
      />
    </div>
  );
}
