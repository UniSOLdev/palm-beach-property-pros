/** SEO scoring and slug validation for Site Studio pages. */

export type SeoFields = {
  slug: string;
  seo_title: string;
  meta_description: string;
  og_image_url: string;
};

export type SeoScoreResult = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: Array<{ label: string; passed: boolean; tip?: string }>;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(slug: string): { valid: boolean; message: string } {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return { valid: false, message: "Slug is required" };
  if (trimmed === "home") return { valid: true, message: "Homepage slug" };
  if (!SLUG_PATTERN.test(trimmed)) {
    return { valid: false, message: "Use lowercase letters, numbers, and hyphens only" };
  }
  if (trimmed.length > 64) return { valid: false, message: "Slug must be 64 characters or fewer" };
  return { valid: true, message: "Valid slug" };
}

export function computeSeoScore(fields: SeoFields, sectionCount = 0): SeoScoreResult {
  const checks: SeoScoreResult["checks"] = [];

  const titleLen = fields.seo_title.trim().length;
  checks.push({
    label: "SEO title (30–60 chars)",
    passed: titleLen >= 30 && titleLen <= 60,
    tip: titleLen < 30 ? "Add more descriptive keywords" : titleLen > 60 ? "Shorten for search results" : undefined,
  });

  const descLen = fields.meta_description.trim().length;
  checks.push({
    label: "Meta description (120–160 chars)",
    passed: descLen >= 120 && descLen <= 160,
    tip: descLen < 120 ? "Expand with value proposition" : descLen > 160 ? "Trim to avoid truncation" : undefined,
  });

  checks.push({
    label: "OG image set",
    passed: Boolean(fields.og_image_url.trim()),
    tip: "Add a 1200×630 social preview image",
  });

  checks.push({
    label: "Valid URL slug",
    passed: validateSlug(fields.slug).valid,
  });

  checks.push({
    label: "Page has content sections",
    passed: sectionCount >= 2,
    tip: "Add at least 2 sections for rich content",
  });

  const passed = checks.filter((c) => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);
  const grade: SeoScoreResult["grade"] =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

  return { score, grade, checks };
}
