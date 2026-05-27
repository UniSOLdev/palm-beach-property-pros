import { z } from "zod";

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const mediaRefSchema = z.object({
  mediaId: z.string().uuid().optional(),
  src: z.string().optional(),
  alt: z.string().optional(),
});

export const heroSectionSchema = z.object({
  eyebrow: z.string().default("Palm Beach Property Operations"),
  headline: z.string().default("Property operations for Palm Beach County estates"),
  subheadline: z
    .string()
    .default(
      "Recurring estate support, turnovers, and field programs—coordinated with professional crews, documented execution, and modern client systems.",
    ),
  heroMediaId: z.string().uuid().optional(),
  imageUrl: z.string().optional(),
  chips: z.array(z.string()).default([
    "Licensed & insured",
    "Palm Beach County operations",
    "Documented field execution",
    "Estate & turnover programs",
  ]),
  primaryCta: linkSchema.default({ label: "Request a scope review", href: "/quote" }),
  secondaryCta: linkSchema.optional(),
  useCuratedHero: z.boolean().default(true),
});

export const transformationProofSectionSchema = z.object({
  eyebrow: z.string().default("Transformation proof"),
  headline: z.string().default("Documented estate transformations"),
  lead: z.string().default("Before-and-after evidence from real Palm Beach County field programs."),
  source: z.enum(["database", "manual"]).default("database"),
  projectId: z.string().uuid().optional(),
  pairIds: z.array(z.string().uuid()).default([]),
  featuredOnly: z.boolean().default(true),
});

export const transformationArcSectionSchema = z.object({
  eyebrow: z.string().default("Story arc"),
  headline: z.string().default("From overgrown to restored"),
  lead: z.string().default("Operational documentation across the full transformation timeline."),
  projectId: z.string().uuid().optional(),
  useCuratedStoryArc: z.boolean().default(true),
});

export const additionalProofSectionSchema = z.object({
  eyebrow: z.string().default("Before & after gallery"),
  headline: z.string().default("Every angle documented"),
  lead: z.string().default("Paired comparisons from documented estate programs."),
  source: z.enum(["database", "manual"]).default("database"),
  pairIds: z.array(z.string().uuid()).default([]),
  manualPairs: z
    .array(
      z.object({
        label: z.string(),
        beforeMediaId: z.string().uuid().optional(),
        afterMediaId: z.string().uuid().optional(),
        duringMediaId: z.string().uuid().optional(),
      }),
    )
    .default([]),
});

export const recurringProgramsSectionSchema = z.object({
  eyebrow: z.string().default("Recurring programs"),
  headline: z.string().default("Estate & turnover programs"),
  lead: z.string().default("Operational cadences built for Palm Beach County properties."),
  source: z.enum(["database", "manual"]).default("database"),
  programIds: z.array(z.string().uuid()).default([]),
  programs: z
    .array(
      z.object({
        eyebrow: z.string(),
        title: z.string(),
        body: z.string(),
        icon: z.string().optional(),
      }),
    )
    .default([]),
});

export const serviceDivisionsSectionSchema = z.object({
  eyebrow: z.string().default("Service divisions"),
  headline: z.string().default("Exterior, interior, and property support"),
  lead: z.string().default("Three operational divisions aligned to coastal estate standards."),
  divisions: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        examples: z.array(z.string()).default([]),
        links: z.array(linkSchema).default([]),
        media: mediaRefSchema.optional(),
      }),
    )
    .default([]),
});

export const projectRecapSectionSchema = z.object({
  eyebrow: z.string().default("Project recaps"),
  headline: z.string().default("Recent field programs"),
  lead: z.string().default("Featured project documentation with scope, location, and turnaround."),
  source: z.enum(["database", "manual"]).default("database"),
  projectIds: z.array(z.string().uuid()).default([]),
  featuredOnly: z.boolean().default(true),
  maxItems: z.number().min(1).max(12).default(6),
});

export const whoWeServeSectionSchema = z.object({
  eyebrow: z.string().default("Who we serve"),
  headline: z.string().default("Built for Palm Beach stakeholders"),
  lead: z.string().default("Estate owners, managers, and operators across the county."),
  audiences: z.array(z.string()).default([
    "Estate homeowners",
    "Seasonal residents",
    "Property managers",
    "Airbnb operators",
    "Realtor partners",
    "Storefront operators",
    "HOA communities",
  ]),
  media: mediaRefSchema.optional(),
});

export const operationalCredibilitySectionSchema = z.object({
  eyebrow: z.string().default("Operational credibility"),
  headline: z.string().default("How we operate"),
  lead: z.string().default("Written scope, county-native scheduling, and operational records."),
  pillars: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
      }),
    )
    .default([
      {
        title: "Written scope first",
        body: "Access notes, substrates, and checkpoints confirmed before crews dispatch.",
      },
      {
        title: "County-native scheduling",
        body: "Salt exposure, humidity, and seasonal occupancy inform how programs run.",
      },
      {
        title: "Operational records",
        body: "Photo checklists, walkthrough notes, and visit logs when your asset requires them.",
      },
    ]),
});

export const localPresenceSectionSchema = z.object({
  eyebrow: z.string().default("Local presence"),
  headline: z.string().default("Palm Beach County operations"),
  lead: z.string().default("Local crews, local knowledge, and county-specific execution standards."),
  markets: z.array(z.object({ name: z.string(), detail: z.string().optional() })).default([]),
});

export const workflowSectionSchema = z.object({
  eyebrow: z.string().default("Field workflow"),
  headline: z.string().default("How a visit runs"),
  lead: z.string().default("From scope review through documented delivery."),
  source: z.enum(["database", "manual"]).default("database"),
  stepIds: z.array(z.string().uuid()).default([]),
  media: mediaRefSchema.optional(),
});

export const documentationSystemsSectionSchema = z.object({
  eyebrow: z.string().default("Documentation systems"),
  headline: z.string().default("Operational documentation"),
  lead: z.string().default("Photo checklists, visit logs, and client portal records."),
  source: z.enum(["database", "manual"]).default("database"),
  featureIds: z.array(z.string().uuid()).default([]),
});

export const faqSectionSchema = z.object({
  eyebrow: z.string().default("FAQ"),
  headline: z.string().default("Frequently asked questions"),
  items: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  useSiteFaq: z.boolean().default(true),
});

export const ctaSectionSchema = z.object({
  eyebrow: z.string().default("Get started"),
  headline: z.string().default("Request a scope review"),
  body: z.string().default("Tell us about your property and operational needs—we respond quickly."),
  primaryCta: linkSchema.default({ label: "Request a scope review", href: "/quote" }),
  secondaryCta: linkSchema.optional(),
  showPhone: z.boolean().default(true),
  gradientBg: z.boolean().default(true),
});

export const SECTION_SCHEMAS = {
  hero_v2: heroSectionSchema,
  transformation_proof: transformationProofSectionSchema,
  transformation_arc: transformationArcSectionSchema,
  additional_proof: additionalProofSectionSchema,
  recurring_programs: recurringProgramsSectionSchema,
  service_divisions: serviceDivisionsSectionSchema,
  project_recap: projectRecapSectionSchema,
  who_we_serve: whoWeServeSectionSchema,
  operational_credibility: operationalCredibilitySectionSchema,
  local_presence: localPresenceSectionSchema,
  workflow: workflowSectionSchema,
  documentation_systems: documentationSystemsSectionSchema,
  cta_v2: ctaSectionSchema,
} as const;

export type ModularSectionType = keyof typeof SECTION_SCHEMAS;

export function parseModularSectionContent<T extends ModularSectionType>(
  type: T,
  content: unknown,
): z.infer<(typeof SECTION_SCHEMAS)[T]> {
  return SECTION_SCHEMAS[type].parse(content ?? {}) as z.infer<(typeof SECTION_SCHEMAS)[T]>;
}

export function defaultModularSectionContent(type: ModularSectionType) {
  return parseModularSectionContent(type, {});
}
