"use client";

import { useState } from "react";

export function CmsBootstrapButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        className="min-h-[44px] rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-60"
        onClick={async () => {
          const publishHomepage = confirm(
            "Also publish homepage to the live site immediately?\n\nOK = publish live\nCancel = drafts only",
          );
          setBusy(true);
          setMessage(null);
          try {
            const res = await fetch("/api/admin/cms/bootstrap", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ publishHomepage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Bootstrap failed");
            setMessage(`Bootstrap OK. ${publishHomepage ? "Homepage is live." : "Drafts only — open Homepage to publish."}`);
            setTimeout(() => window.location.reload(), 900);
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Bootstrap failed");
            setBusy(false);
          }
        }}
      >
        {busy ? "Bootstrapping…" : "Bootstrap drafts from live site defaults"}
      </button>
      {message ? <p className="text-xs text-zinc-400" aria-live="polite">{message}</p> : null}
    </div>
  );
}
