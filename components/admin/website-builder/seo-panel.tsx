"use client";

import { computeSeoScore, validateSlug } from "@/lib/cms/seo-utils";
import { enhanceMetaDescription, enhanceSeoTitle } from "@/lib/cms/ai-copy";

type SeoState = {
  slug: string;
  seo_title: string;
  meta_description: string;
  og_image_url: string;
};

export function SeoPanel({
  seo,
  sectionCount,
  onChange,
}: {
  seo: SeoState;
  sectionCount: number;
  onChange: (patch: Partial<SeoState>) => void;
}) {
  const score = computeSeoScore(seo, sectionCount);
  const slugCheck = validateSlug(seo.slug);

  const gradeColors = {
    A: "bg-green-100 text-green-800",
    B: "bg-sky/60 text-navy",
    C: "bg-amber-100 text-amber-900",
    D: "bg-orange-100 text-orange-900",
    F: "bg-red-100 text-red-800",
  };

  return (
    <details className="studio-panel" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold text-navy">
        <span>Page SEO</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${gradeColors[score.grade]}`}>
          {score.grade} · {score.score}%
        </span>
      </summary>

      <div className="mt-4 space-y-3">
        <div className="space-y-1">
          {score.checks.map((check) => (
            <div key={check.label} className="flex items-start gap-2 text-xs">
              <span className={check.passed ? "text-green-600" : "text-amber-600"}>{check.passed ? "✓" : "○"}</span>
              <span className="text-charcoal/75">{check.label}</span>
            </div>
          ))}
        </div>

        <label className="block text-xs font-medium text-navy">
          URL slug
          <input
            className="admin-input text-sm"
            value={seo.slug}
            onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
            placeholder="home"
          />
          <span className={`mt-1 block text-[11px] ${slugCheck.valid ? "text-green-700" : "text-red-600"}`}>
            {slugCheck.message}
          </span>
        </label>

        <label className="block text-xs font-medium text-navy">
          <span className="flex items-center justify-between">
            SEO title
            <button
              type="button"
              className="text-[10px] font-semibold text-ocean"
              onClick={() => onChange({ seo_title: enhanceSeoTitle(seo.seo_title || seo.slug) })}
            >
              ✨ Enhance
            </button>
          </span>
          <input
            className="admin-input text-sm"
            value={seo.seo_title}
            onChange={(e) => onChange({ seo_title: e.target.value })}
          />
          <span className="text-[11px] text-charcoal/50">{seo.seo_title.length}/60 chars</span>
        </label>

        <label className="block text-xs font-medium text-navy">
          <span className="flex items-center justify-between">
            Meta description
            <button
              type="button"
              className="text-[10px] font-semibold text-ocean"
              onClick={() => onChange({ meta_description: enhanceMetaDescription(seo.meta_description) })}
            >
              ✨ Enhance
            </button>
          </span>
          <textarea
            className="admin-input min-h-[72px] text-sm"
            value={seo.meta_description}
            onChange={(e) => onChange({ meta_description: e.target.value })}
          />
          <span className="text-[11px] text-charcoal/50">{seo.meta_description.length}/160 chars</span>
        </label>

        <label className="block text-xs font-medium text-navy">
          OG image URL
          <input
            className="admin-input text-sm"
            value={seo.og_image_url}
            onChange={(e) => onChange({ og_image_url: e.target.value })}
            placeholder="https://…"
          />
        </label>

        <p className="text-xs text-charcoal/60">
          Live path: <code className="rounded bg-sky/30 px-1">/{seo.slug === "home" ? "" : seo.slug}</code>
        </p>
      </div>
    </details>
  );
}
