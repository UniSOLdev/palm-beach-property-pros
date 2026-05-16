"use client";

export function CmsBootstrapButton() {
  return (
    <button
      type="button"
      className="rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/25"
      onClick={async () => {
        const publishHomepage = confirm(
          "Also publish homepage to the live site immediately?\n\nOK = publish live\nCancel = drafts only",
        );
        const res = await fetch("/api/admin/cms/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publishHomepage }),
        });
        const data = await res.json();
        if (!res.ok) alert(data.error ?? "Bootstrap failed");
        else alert(`Bootstrap OK. ${publishHomepage ? "Homepage is live." : "Drafts only — open Homepage to publish."}`);
        window.location.reload();
      }}
    >
      Bootstrap drafts from live site defaults
    </button>
  );
}
