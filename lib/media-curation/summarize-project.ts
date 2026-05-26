import type { ProjectMetadata, ScoredSourceImage } from "./types";

const TAG_RULES: Array<{ pattern: RegExp; tag: string }> = [
  { pattern: /pressure|wash|paver|driveway|hardscape/i, tag: "pressure washing" },
  { pattern: /trim|vegetation|landscape|palm|hedge|debris/i, tag: "landscape refinement" },
  { pattern: /path|walkway|edge|curb/i, tag: "pathway clearing" },
  { pattern: /pool|deck|lanai|patio/i, tag: "exterior living areas" },
  { pattern: /window|glass/i, tag: "glass & exterior detail" },
  { pattern: /turnover|airbnb|staging/i, tag: "turnover prep" },
];

export function inferTags(metadata: ProjectMetadata, images: ScoredSourceImage[]): string[] {
  const tags = new Set<string>(metadata.tags ?? []);
  const haystack = [metadata.title, metadata.summary, ...(metadata.scope ?? [])].filter(Boolean).join(" ");

  for (const rule of TAG_RULES) {
    if (rule.pattern.test(haystack)) tags.add(rule.tag);
  }

  if (images.some((i) => i.folder === "after" && i.aspect >= 1.4)) tags.add("estate exterior");
  if (images.some((i) => i.sharpness >= 40)) tags.add("detailed finish");

  return [...tags].slice(0, 6);
}

export function inferDivision(metadata: ProjectMetadata, tags: string[]): ProjectMetadata["division"] {
  if (metadata.division) return metadata.division;
  if (tags.some((t) => /turnover|staging|interior/i.test(t))) return "property-support";
  if (tags.some((t) => /kitchen|interior|reset/i.test(t))) return "interior";
  return "exterior";
}

export function generateSummary(metadata: ProjectMetadata, tags: string[], location: string): string {
  if (metadata.summary) return metadata.summary;

  const lead =
    metadata.title ??
    "Estate exterior restoration and property operations support";

  const featureList = tags.slice(0, 4).join(", ");
  return `${lead} in ${location}${featureList ? ` featuring ${featureList}` : ""}. Documented field execution with before-and-after visibility for property stakeholders.`;
}

export function rankProject(options: {
  pairCount: number;
  topImageScore: number;
  clipCount: number;
  galleryCount: number;
}): number {
  return Math.round(
    options.topImageScore * 0.45 +
      options.pairCount * 12 +
      options.clipCount * 8 +
      Math.min(options.galleryCount, 8) * 2,
  );
}
