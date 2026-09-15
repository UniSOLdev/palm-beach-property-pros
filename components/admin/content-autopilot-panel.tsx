"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  approveContentDraft,
  rejectContentDraft,
  type ContentDraftRow,
} from "@/lib/autopilot/actions/content-drafts";

type Filter = "pending_review" | "approved" | "rejected" | "all";

function draftTypeLabel(type: string) {
  switch (type) {
    case "homepage_section":
      return "Homepage section";
    case "project_page":
      return "Project page";
    case "service_copy":
      return "Service copy";
    case "testimonial":
      return "Testimonial";
    case "social_post":
      return "Social post";
    default:
      return type;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "pending_review":
      return "bg-amber-100 text-amber-900";
    case "approved":
      return "bg-leaf/20 text-leaf";
    case "published":
      return "bg-ocean/15 text-ocean";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-sky/30 text-navy";
  }
}

function contentPreview(content: Record<string, unknown>) {
  const headline = typeof content.headline === "string" ? content.headline : null;
  const body = typeof content.body === "string" ? content.body : null;
  const tagline = typeof content.tagline === "string" ? content.tagline : null;
  return headline || body || tagline || "No preview available.";
}

function sourceLink(draft: ContentDraftRow) {
  if (draft.source_entity_type === "job" && draft.source_entity_id) {
    return `/admin/jobs/${draft.source_entity_id}`;
  }
  if (draft.source_entity_type === "transformation_pair") {
    return "/admin/website/transformations";
  }
  return null;
}

export function ContentAutopilotPanel({ initialDrafts }: { initialDrafts: ContentDraftRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("pending_review");
  const [drafts, setDrafts] = useState(initialDrafts);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return drafts;
    return drafts.filter((d) => d.status === filter);
  }, [drafts, filter]);

  const counts = useMemo(() => {
    const pendingReview = drafts.filter((d) => d.status === "pending_review").length;
    const approved = drafts.filter((d) => d.status === "approved").length;
    const rejected = drafts.filter((d) => d.status === "rejected").length;
    return { pendingReview, approved, rejected };
  }, [drafts]);

  function handleApprove(id: string) {
    startTransition(async () => {
      try {
        setError("");
        const updated = await approveContentDraft(id);
        setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Approve failed");
      }
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      try {
        setError("");
        const updated = await rejectContentDraft(id);
        setDrafts((prev) => prev.map((d) => (d.id === id ? updated : d)));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Reject failed");
      }
    });
  }

  const tabs: { id: Filter; label: string; count?: number }[] = [
    { id: "pending_review", label: "Review", count: counts.pendingReview },
    { id: "approved", label: "Approved", count: counts.approved },
    { id: "rejected", label: "Rejected", count: counts.rejected },
    { id: "all", label: "All" },
  ];

  return (
    <div className="space-y-4 pb-8">
      <div className="admin-card space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean">
            Content autopilot
          </p>
          <h1 className="text-xl font-bold text-navy">Review queue</h1>
          <p className="text-sm text-charcoal/70">
            AI-generated homepage and project drafts land here every Monday. Nothing publishes until
            you approve.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-amber-50 px-3 py-2">
            <p className="text-lg font-bold text-navy">{counts.pendingReview}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/60">
              Pending
            </p>
          </div>
          <div className="rounded-xl bg-leaf/10 px-3 py-2">
            <p className="text-lg font-bold text-navy">{counts.approved}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/60">
              Approved
            </p>
          </div>
          <div className="rounded-xl bg-sky/30 px-3 py-2">
            <p className="text-lg font-bold text-navy">{counts.rejected}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/60">
              Rejected
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid grid-cols-4 gap-1 rounded-2xl border border-navy/10 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`min-h-[48px] rounded-xl px-1 text-[10px] font-semibold transition ${
              filter === t.id ? "bg-navy text-white shadow-md" : "text-navy hover:bg-sky/40"
            }`}
          >
            {t.label}
            {t.count !== undefined ? (
              <span className="mt-0.5 block text-xs opacity-80">{t.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div className="admin-card text-sm text-charcoal/70">
          No drafts in this queue. The weekly cron runs Monday at 8am, or trigger{" "}
          <code className="rounded bg-sky/30 px-1">/api/cron/content</code> manually.
        </div>
      ) : (
        <section className="space-y-3">
          {filtered.map((draft) => {
            const href = sourceLink(draft);
            const expanded = expandedId === draft.id;
            const beforeCount = Array.isArray(draft.content.beforeUrls)
              ? draft.content.beforeUrls.length
              : 0;
            const afterCount = Array.isArray(draft.content.afterUrls)
              ? draft.content.afterUrls.length
              : 0;

            return (
              <article key={draft.id} className="admin-card space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusBadge(draft.status)}`}
                      >
                        {draft.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ocean">
                        {draftTypeLabel(draft.draft_type)}
                      </span>
                    </div>
                    <h2 className="mt-2 font-bold text-navy">{draft.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-charcoal/75">
                      {contentPreview(draft.content)}
                    </p>
                    <p className="mt-2 text-xs text-charcoal/55">
                      Created {new Date(draft.created_at).toLocaleString()}
                    </p>
                  </div>
                  {draft.draft_type === "project_page" && (beforeCount > 0 || afterCount > 0) ? (
                    <div className="rounded-xl bg-sky/20 px-3 py-2 text-center text-xs font-semibold text-navy">
                      {beforeCount} before · {afterCount} after
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : draft.id)}
                  className="text-xs font-semibold text-ocean"
                >
                  {expanded ? "Hide details" : "Show details"}
                </button>

                {expanded ? (
                  <pre className="max-h-48 overflow-auto rounded-xl bg-navy/5 p-3 text-xs text-charcoal/80">
                    {JSON.stringify(draft.content, null, 2)}
                  </pre>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {href ? (
                    <Link
                      href={href}
                      className="admin-btn-secondary min-h-[44px] flex-1 text-center no-underline"
                    >
                      View source
                    </Link>
                  ) : null}
                  {draft.status === "pending_review" ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleReject(draft.id)}
                        className="admin-btn-secondary min-h-[44px] flex-1"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleApprove(draft.id)}
                        className="admin-btn min-h-[44px] flex-1"
                      >
                        Approve
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
