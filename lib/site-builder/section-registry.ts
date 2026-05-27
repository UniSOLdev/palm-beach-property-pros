import type { z } from "zod";
import {
  defaultModularSectionContent,
  parseModularSectionContent,
  SECTION_SCHEMAS,
  type ModularSectionType,
} from "./schemas";

export type { ModularSectionType };

export const MODULAR_SECTION_TYPES = Object.keys(SECTION_SCHEMAS) as ModularSectionType[];

export type SectionCategory =
  | "hero"
  | "proof"
  | "operations"
  | "services"
  | "conversion"
  | "content";

export type SectionRegistryEntry = {
  type: ModularSectionType;
  label: string;
  icon: string;
  category: SectionCategory;
  description: string;
  defaultData: () => Record<string, unknown>;
  schema: z.ZodType;
  supportsDynamicData?: boolean;
  locked?: boolean;
};

const META: Record<
  ModularSectionType,
  Omit<SectionRegistryEntry, "type" | "defaultData" | "schema">
> = {
  hero_v2: {
    label: "Premium Hero",
    icon: "◆",
    category: "hero",
    description: "Cinematic hero with chips, CTAs, and curated media",
    locked: true,
  },
  transformation_proof: {
    label: "Transformation Proof",
    icon: "⟷",
    category: "proof",
    description: "Featured before/after projects from database pairs",
    supportsDynamicData: true,
  },
  transformation_arc: {
    label: "Transformation Arc",
    icon: "▶",
    category: "proof",
    description: "Story arc timeline with during-state media",
    supportsDynamicData: true,
  },
  additional_proof: {
    label: "Additional Proof",
    icon: "▣",
    category: "proof",
    description: "Before/after grid from manually assigned pairs",
    supportsDynamicData: true,
  },
  recurring_programs: {
    label: "Recurring Programs",
    icon: "↻",
    category: "services",
    description: "Estate care plans and turnover programs",
    supportsDynamicData: true,
  },
  service_divisions: {
    label: "Service Divisions",
    icon: "⬡",
    category: "services",
    description: "Exterior, interior, and property support divisions",
  },
  project_recap: {
    label: "Project Recaps",
    icon: "📋",
    category: "proof",
    description: "Dynamic project recap cards with scope and media",
    supportsDynamicData: true,
  },
  who_we_serve: {
    label: "Who We Serve",
    icon: "◎",
    category: "content",
    description: "Audience segments and stakeholder types",
  },
  operational_credibility: {
    label: "Operational Credibility",
    icon: "✓",
    category: "operations",
    description: "Written scope, scheduling, and records pillars",
  },
  local_presence: {
    label: "Local Presence",
    icon: "📍",
    category: "content",
    description: "Palm Beach County markets and local operations",
    supportsDynamicData: true,
  },
  workflow: {
    label: "Workflow Timeline",
    icon: "→",
    category: "operations",
    description: "Field execution steps from scope to delivery",
    supportsDynamicData: true,
  },
  documentation_systems: {
    label: "Documentation Systems",
    icon: "📁",
    category: "operations",
    description: "Photo checklists, logs, and portal documentation",
    supportsDynamicData: true,
  },
  cta_v2: {
    label: "Premium CTA",
    icon: "▸",
    category: "conversion",
    description: "Conversion band with quote CTA and phone",
  },
};

export const SECTION_REGISTRY: SectionRegistryEntry[] = MODULAR_SECTION_TYPES.map((type) => ({
  type,
  ...META[type],
  schema: SECTION_SCHEMAS[type],
  defaultData: () => defaultModularSectionContent(type) as Record<string, unknown>,
}));

export const SECTION_REGISTRY_MAP = Object.fromEntries(
  SECTION_REGISTRY.map((entry) => [entry.type, entry]),
) as Record<ModularSectionType, SectionRegistryEntry>;

export const MODULAR_SECTION_LABELS: Record<ModularSectionType, string> = Object.fromEntries(
  SECTION_REGISTRY.map((e) => [e.type, e.label]),
) as Record<ModularSectionType, string>;

export const CATEGORY_LABELS: Record<SectionCategory, string> = {
  hero: "Hero & Intro",
  proof: "Transformation Proof",
  operations: "Operations",
  services: "Services & Programs",
  conversion: "Conversion",
  content: "Content",
};

export function isModularSectionType(value: string): value is ModularSectionType {
  return MODULAR_SECTION_TYPES.includes(value as ModularSectionType);
}

export function searchModularSections(query: string): SectionRegistryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return SECTION_REGISTRY;
  return SECTION_REGISTRY.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.type.includes(q),
  );
}

export { defaultModularSectionContent, parseModularSectionContent };

/** Default premium homepage section stack matching production layout. */
export function defaultPremiumHomepageSections(): Array<{
  section_type: ModularSectionType;
  label: string;
  sort_order: number;
  content: Record<string, unknown>;
}> {
  const order: ModularSectionType[] = [
    "hero_v2",
    "transformation_proof",
    "additional_proof",
    "transformation_arc",
    "recurring_programs",
    "service_divisions",
    "project_recap",
    "who_we_serve",
    "operational_credibility",
    "local_presence",
    "workflow",
    "documentation_systems",
    "cta_v2",
  ];
  return order.map((type, index) => ({
    section_type: type,
    label: MODULAR_SECTION_LABELS[type],
    sort_order: index,
    content: defaultModularSectionContent(type) as Record<string, unknown>,
  }));
}
