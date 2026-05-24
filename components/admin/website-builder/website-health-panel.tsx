"use client";

import { computeWebsiteHealth } from "@/lib/cms/website-health";
import type { WebsiteSectionRow } from "@/lib/cms/section-registry";

export function WebsiteHealthPanel({
  seo,
  sections,
  pageStatus,
}: {
  seo: { slug: string; seo_title: string; meta_description: string; og_image_url: string };
  sections: WebsiteSectionRow[];
  pageStatus: string;
}) {
  const report = computeWebsiteHealth(seo, sections, pageStatus);

  const gradeColors = {
    A: "from-green-500 to-emerald-600",
    B: "from-ocean to-navy",
    C: "from-amber-400 to-orange-500",
    D: "from-orange-500 to-red-500",
    F: "from-red-500 to-red-700",
  };

  return (
    <div className="studio-panel space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-navy">Website health</h3>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${gradeColors[report.grade]} text-sm font-bold text-white shadow-md`}>
          {report.grade}
        </div>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-sky/40">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${gradeColors[report.grade]} transition-all duration-500`}
          style={{ width: `${report.overallScore}%` }}
        />
      </div>
      <p className="text-center text-xs font-semibold text-charcoal/70">{report.overallScore}% overall score</p>

      <ul className="space-y-2">
        {report.categories.map((cat) => (
          <li key={cat.name} className="rounded-xl bg-cream/60 px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-navy">{cat.name}</span>
              <span className="text-charcoal/60">{cat.score}%</span>
            </div>
            {cat.issues.length > 0 ? (
              <ul className="mt-1 space-y-0.5">
                {cat.issues.slice(0, 2).map((issue) => (
                  <li key={issue} className="text-[10px] text-amber-800">• {issue}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[10px] text-green-700">All checks passed</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
