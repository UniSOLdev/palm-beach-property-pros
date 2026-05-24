import { computeSeoScore, type SeoFields } from "@/lib/cms/seo-utils";
import type { WebsiteSectionRow } from "@/lib/cms/section-registry";

export type WebsiteHealthReport = {
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categories: Array<{
    name: string;
    score: number;
    issues: string[];
  }>;
};

export function computeWebsiteHealth(
  seo: SeoFields,
  sections: WebsiteSectionRow[],
  pageStatus: string,
): WebsiteHealthReport {
  const seoResult = computeSeoScore(seo, sections.length);
  const visibleSections = sections.filter((s) => s.is_visible);

  const contentIssues: string[] = [];
  if (visibleSections.length < 3) contentIssues.push("Add at least 3 visible sections");
  if (!visibleSections.some((s) => s.section_type === "hero")) contentIssues.push("Add a hero section");
  if (!visibleSections.some((s) => s.section_type === "cta")) contentIssues.push("Add a call-to-action section");

  const hasImages = sections.some((s) => {
    const c = s.content;
    return Boolean(c.imageUrl || c.posterUrl || (Array.isArray(c.items) && c.items.some((i: { imageUrl?: string }) => i?.imageUrl)));
  });
  if (!hasImages) contentIssues.push("Add images for visual impact");

  const contentScore = Math.max(0, 100 - contentIssues.length * 20);

  const publishIssues: string[] = [];
  if (pageStatus !== "published") publishIssues.push("Page is still in draft — publish when ready");

  const publishScore = pageStatus === "published" ? 100 : 60;

  const accessibilityIssues: string[] = [];
  const heroSection = sections.find((s) => s.section_type === "hero");
  if (heroSection && !heroSection.content.imageUrl) {
    accessibilityIssues.push("Hero missing background image");
  }

  const accessibilityScore = Math.max(0, 100 - accessibilityIssues.length * 25);

  const categories = [
    { name: "SEO", score: seoResult.score, issues: seoResult.checks.filter((c) => !c.passed).map((c) => c.label) },
    { name: "Content", score: contentScore, issues: contentIssues },
    { name: "Publish", score: publishScore, issues: publishIssues },
    { name: "Media", score: hasImages ? 100 : 40, issues: hasImages ? [] : ["No images detected"] },
    { name: "Structure", score: accessibilityScore, issues: accessibilityIssues },
  ];

  const overallScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
  const grade: WebsiteHealthReport["grade"] =
    overallScore >= 90 ? "A" : overallScore >= 75 ? "B" : overallScore >= 60 ? "C" : overallScore >= 40 ? "D" : "F";

  return { overallScore, grade, categories };
}
