import { z } from "zod";

export const WEBSITE_SECTION_TYPES = [
  "hero",
  "services",
  "gallery",
  "before_after",
  "testimonials",
  "stats",
  "faq",
  "cta",
  "service_areas",
  "pricing",
  "process",
  "team",
  "video",
  "quote_form",
  "contact",
  "rich_text",
] as const;

export type WebsiteSectionType = (typeof WEBSITE_SECTION_TYPES)[number];

export const SECTION_TYPE_LABELS: Record<WebsiteSectionType, string> = {
  hero: "Hero",
  services: "Services",
  gallery: "Gallery",
  before_after: "Before & After",
  testimonials: "Testimonials",
  stats: "Stats",
  faq: "FAQ",
  cta: "Call to Action",
  service_areas: "Service Areas",
  pricing: "Pricing",
  process: "Process",
  team: "Team",
  video: "Video",
  quote_form: "Quote Form",
  contact: "Contact",
  rich_text: "Rich Text",
};

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const heroContentSchema = z.object({
  eyebrow: z.string().default("Premium Property Operations"),
  headline: z.string().default("Property Care for Palm Beach Living"),
  subheadline: z.string().default(""),
  imageUrl: z.string().url().optional(),
  chips: z.array(z.string()).default([]),
  primaryCta: linkSchema.optional(),
  secondaryCta: linkSchema.optional(),
});

export const servicesContentSchema = z.object({
  headline: z.string().default(""),
  subheadline: z.string().default(""),
  columns: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        links: z.array(linkSchema).default([]),
      }),
    )
    .default([]),
});

export const statsContentSchema = z.object({
  items: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
});

export const testimonialsContentSchema = z.object({
  headline: z.string().default(""),
  items: z
    .array(
      z.object({
        quote: z.string(),
        author: z.string(),
        rating: z.number().min(1).max(5).optional(),
      }),
    )
    .default([]),
});

export const faqContentSchema = z.object({
  headline: z.string().default("Frequently asked questions"),
  items: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
});

export const ctaContentSchema = z.object({
  headline: z.string().default(""),
  body: z.string().default(""),
  primaryCta: linkSchema.optional(),
  phone: z.string().optional(),
});

export const quoteFormContentSchema = z.object({
  headline: z.string().default(""),
  body: z.string().default(""),
  buttonLabel: z.string().default("Request a quote"),
  buttonHref: z.string().default("/quote"),
});

export const galleryContentSchema = z.object({
  headline: z.string().default(""),
  items: z.array(z.object({ label: z.string(), imageUrl: z.string().optional() })).default([]),
});

export const richTextContentSchema = z.object({
  headline: z.string().default(""),
  body: z.string().default(""),
});

export const genericContentSchema = z.record(z.string(), z.unknown());

export type WebsiteSectionRow = {
  id: string;
  page_id: string;
  section_type: WebsiteSectionType;
  label: string | null;
  sort_order: number;
  is_visible: boolean;
  content: Record<string, unknown>;
};

export type WebsitePageRow = {
  id: string;
  slug: string;
  title: string;
  page_type: string;
  seo_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  preview_token: string;
  status: "draft" | "published";
  published_at: string | null;
};

export type ViewportMode = "desktop" | "tablet" | "mobile";

export const VIEWPORT_WIDTHS: Record<ViewportMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

export function defaultContentForType(type: WebsiteSectionType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return heroContentSchema.parse({});
    case "services":
      return servicesContentSchema.parse({ columns: [] });
    case "stats":
      return statsContentSchema.parse({});
    case "testimonials":
      return testimonialsContentSchema.parse({});
    case "faq":
      return faqContentSchema.parse({});
    case "cta":
      return ctaContentSchema.parse({});
    case "quote_form":
      return quoteFormContentSchema.parse({});
    case "gallery":
      return galleryContentSchema.parse({});
    case "rich_text":
      return richTextContentSchema.parse({});
    default:
      return { headline: "", body: "" };
  }
}

export function parseSectionContent(type: WebsiteSectionType, content: Record<string, unknown>) {
  switch (type) {
    case "hero":
      return heroContentSchema.parse({ ...defaultContentForType("hero"), ...content });
    case "services":
      return servicesContentSchema.parse({ ...defaultContentForType("services"), ...content });
    case "stats":
      return statsContentSchema.parse({ ...defaultContentForType("stats"), ...content });
    case "testimonials":
      return testimonialsContentSchema.parse({ ...defaultContentForType("testimonials"), ...content });
    case "faq":
      return faqContentSchema.parse({ ...defaultContentForType("faq"), ...content });
    case "cta":
      return ctaContentSchema.parse({ ...defaultContentForType("cta"), ...content });
    case "quote_form":
      return quoteFormContentSchema.parse({ ...defaultContentForType("quote_form"), ...content });
    case "gallery":
      return galleryContentSchema.parse({ ...defaultContentForType("gallery"), ...content });
    case "rich_text":
      return richTextContentSchema.parse({ ...defaultContentForType("rich_text"), ...content });
    default:
      return { ...defaultContentForType(type), ...content };
  }
}
