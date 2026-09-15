import "server-only";
import {
  enhanceBody,
  enhanceHeadline,
  enhanceMetaDescription,
  enhanceSeoTitle,
  suggestSectionCopy,
} from "@/lib/cms/ai-copy";
import { CORE_SERVICES } from "@/lib/marketing/core-services";
import type { ContentDraftType } from "@/lib/autopilot/types";

export type GeneratedDraft = {
  draft_key: string;
  draft_type: ContentDraftType;
  title: string;
  content: Record<string, unknown>;
  source_entity_type?: string;
  source_entity_id?: string;
};

const HOMEPAGE_SECTIONS = ["hero", "services", "gallery", "testimonials", "cta"] as const;

export function homepageSectionTypes() {
  return [...HOMEPAGE_SECTIONS];
}

export function generateHomepageSectionDraft(sectionType: string): GeneratedDraft {
  const suggested = suggestSectionCopy(sectionType);
  const headline = enhanceHeadline(suggested.headline);
  const body = enhanceBody(suggested.body);

  return {
    draft_key: `homepage_section:${sectionType}:${new Date().toISOString().slice(0, 10)}`,
    draft_type: "homepage_section",
    title: `Homepage — ${sectionType}`,
    content: {
      sectionType,
      headline,
      body,
      seoTitle: enhanceSeoTitle(headline),
      metaDescription: enhanceMetaDescription(body),
      generatedAt: new Date().toISOString(),
    },
  };
}

export function generateServiceCopyDraft(serviceSlug: string): GeneratedDraft | null {
  const service = CORE_SERVICES.find((s) => s.slug === serviceSlug);
  if (!service) return null;

  const tagline = enhanceBody(service.tagline);

  return {
    draft_key: `service_copy:${serviceSlug}:${new Date().toISOString().slice(0, 10)}`,
    draft_type: "service_copy",
    title: `${service.name} — copy refresh`,
    content: {
      slug: serviceSlug,
      name: service.name,
      tagline,
      seoTitle: enhanceSeoTitle(service.name),
      metaDescription: enhanceMetaDescription(service.tagline),
      examples: service.examples,
      generatedAt: new Date().toISOString(),
    },
  };
}

export function generateProjectPageDraft(input: {
  jobId?: string;
  pairId?: string;
  title: string;
  serviceType?: string;
  address?: string;
  beforeUrls: string[];
  afterUrls: string[];
  summary?: string;
}): GeneratedDraft {
  const sourceKey = input.pairId ? `pair:${input.pairId}` : `job:${input.jobId}`;
  const city =
    input.address?.split(",")[0]?.trim() ||
    input.address?.trim() ||
    "Palm Beach County";
  const serviceLabel = input.serviceType?.trim() || "Property care";

  const headline = enhanceHeadline(`${serviceLabel} transformation in ${city}`);
  const body = enhanceBody(
    input.summary ??
      `Before-and-after documentation from a recent ${serviceLabel.toLowerCase()} project in ${city}.`,
  );

  return {
    draft_key: `project_page:${sourceKey}`,
    draft_type: "project_page",
    title: input.title || headline,
    content: {
      headline,
      body,
      seoTitle: enhanceSeoTitle(headline),
      metaDescription: enhanceMetaDescription(body),
      beforeUrls: input.beforeUrls,
      afterUrls: input.afterUrls,
      serviceType: input.serviceType ?? null,
      address: input.address ?? null,
      generatedAt: new Date().toISOString(),
    },
    source_entity_type: input.pairId ? "transformation_pair" : "job",
    source_entity_id: input.pairId ?? input.jobId,
  };
}
