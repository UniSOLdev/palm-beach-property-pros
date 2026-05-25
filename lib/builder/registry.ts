import {
  defaultContentForType,
  SECTION_TYPE_LABELS,
  WEBSITE_SECTION_TYPES,
  type WebsiteSectionType,
} from "@/lib/cms/section-registry";

export type SectionCategory =
  | "hero"
  | "content"
  | "social-proof"
  | "conversion"
  | "media"
  | "business";

export type EditableFieldDef = {
  path: string;
  label: string;
  kind: "text" | "heading" | "body" | "button" | "image";
};

export type SectionRegistryEntry = {
  type: WebsiteSectionType;
  label: string;
  icon: string;
  category: SectionCategory;
  description: string;
  defaultProps: () => Record<string, unknown>;
  editableFields: EditableFieldDef[];
  supportsDynamicData?: boolean;
};

const CATEGORY_LABELS: Record<SectionCategory, string> = {
  hero: "Hero & Intro",
  content: "Content",
  "social-proof": "Social Proof",
  conversion: "Conversion",
  media: "Media & Gallery",
  business: "Business Data",
};

export const SECTION_REGISTRY: SectionRegistryEntry[] = WEBSITE_SECTION_TYPES.map((type) => {
  const base = {
    type,
    label: SECTION_TYPE_LABELS[type],
    defaultProps: () => defaultContentForType(type),
  };

  switch (type) {
    case "hero":
      return {
        ...base,
        icon: "◆",
        category: "hero" as const,
        description: "Full-width hero with image, headline, and CTAs",
        editableFields: [
          { path: "eyebrow", label: "Eyebrow", kind: "text" },
          { path: "headline", label: "Headline", kind: "heading" },
          { path: "subheadline", label: "Subheadline", kind: "body" },
          { path: "primaryCta.label", label: "Primary button", kind: "button" },
          { path: "secondaryCta.label", label: "Secondary button", kind: "button" },
          { path: "imageUrl", label: "Background image", kind: "image" },
        ],
      };
    case "cta":
      return {
        ...base,
        icon: "▸",
        category: "conversion" as const,
        description: "Call-to-action band with buttons and phone",
        editableFields: [
          { path: "headline", label: "Headline", kind: "heading" },
          { path: "body", label: "Body", kind: "body" },
          { path: "primaryCta.label", label: "Button", kind: "button" },
        ],
      };
    case "testimonials":
      return {
        ...base,
        icon: "★",
        category: "social-proof" as const,
        description: "Client quotes with ratings and photos",
        editableFields: [
          { path: "headline", label: "Headline", kind: "heading" },
        ],
      };
    case "services":
      return {
        ...base,
        icon: "✦",
        category: "content" as const,
        description: "Service columns with icons and links",
        editableFields: [
          { path: "headline", label: "Headline", kind: "heading" },
          { path: "subheadline", label: "Subheadline", kind: "body" },
        ],
      };
    case "gallery":
      return {
        ...base,
        icon: "▣",
        category: "media" as const,
        description: "Photo gallery with masonry or grid layout",
        editableFields: [{ path: "headline", label: "Headline", kind: "heading" }],
      };
    case "before_after":
      return {
        ...base,
        icon: "↔",
        category: "media" as const,
        description: "Before/after comparison sliders",
        editableFields: [{ path: "headline", label: "Headline", kind: "heading" }],
      };
    case "faq":
      return {
        ...base,
        icon: "?",
        category: "content" as const,
        description: "Accordion FAQ section",
        editableFields: [{ path: "headline", label: "Headline", kind: "heading" }],
      };
    case "stats":
      return {
        ...base,
        icon: "#",
        category: "social-proof" as const,
        description: "Key metrics and numbers",
        editableFields: [],
      };
    case "pricing":
      return {
        ...base,
        icon: "$",
        category: "conversion" as const,
        description: "Pricing tiers and plans",
        editableFields: [
          { path: "headline", label: "Headline", kind: "heading" },
          { path: "body", label: "Body", kind: "body" },
        ],
      };
    case "quote_form":
      return {
        ...base,
        icon: "📝",
        category: "conversion" as const,
        description: "Quote request CTA block",
        editableFields: [
          { path: "headline", label: "Headline", kind: "heading" },
          { path: "body", label: "Body", kind: "body" },
          { path: "buttonLabel", label: "Button", kind: "button" },
        ],
      };
    case "team":
      return {
        ...base,
        icon: "👥",
        category: "business" as const,
        description: "Team members — dynamic from crew data",
        editableFields: [
          { path: "headline", label: "Headline", kind: "heading" },
          { path: "body", label: "Body", kind: "body" },
        ],
        supportsDynamicData: true,
      };
    case "service_areas":
      return {
        ...base,
        icon: "📍",
        category: "business" as const,
        description: "Service area coverage map/list",
        editableFields: [
          { path: "headline", label: "Headline", kind: "heading" },
          { path: "body", label: "Body", kind: "body" },
        ],
        supportsDynamicData: true,
      };
    default:
      return {
        ...base,
        icon: "▢",
        category: "content" as const,
        description: `${SECTION_TYPE_LABELS[type]} section`,
        editableFields: [
          { path: "headline", label: "Headline", kind: "heading" },
          { path: "body", label: "Body", kind: "body" },
        ],
      };
  }
});

export function getSectionEntry(type: WebsiteSectionType): SectionRegistryEntry {
  return SECTION_REGISTRY.find((e) => e.type === type)!;
}

export function getSectionsByCategory(category: SectionCategory): SectionRegistryEntry[] {
  return SECTION_REGISTRY.filter((e) => e.category === category);
}

export function searchSections(query: string): SectionRegistryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return SECTION_REGISTRY;
  return SECTION_REGISTRY.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.type.includes(q) ||
      CATEGORY_LABELS[e.category].toLowerCase().includes(q),
  );
}

export { CATEGORY_LABELS };
