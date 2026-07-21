/** Shared types for DB-backed site content (services, projects, homepage). */

export type PricingMode = "starting_at" | "custom_estimate" | "hidden";

export type SiteServiceFaq = {
  id: string;
  service_id: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type SiteServiceMedia = {
  id: string;
  service_id: string;
  media_asset_id: string;
  sort_order: number;
  media?: SiteMediaAsset | null;
};

export type SiteService = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  headline: string;
  authority_intro: string;
  best_for: string;
  included: string[];
  add_ons: string[];
  who_its_for: string[];
  process_steps: string[];
  pricing_mode: PricingMode;
  pricing_label: string;
  cta_headline: string;
  cta_body: string;
  cover_image_url: string | null;
  cover_media_id: string | null;
  water_access_note: string | null;
  seo_title: string | null;
  seo_description: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  faqs?: SiteServiceFaq[];
  gallery?: SiteServiceMedia[];
};

export type GalleryPhase = "before" | "during" | "after" | "general";

export type SiteProjectMedia = {
  id: string;
  project_id: string;
  media_asset_id: string;
  gallery_phase: GalleryPhase;
  caption: string | null;
  sort_order: number;
  media?: SiteMediaAsset | null;
};

export type SiteProject = {
  id: string;
  title: string;
  slug: string;
  city: string | null;
  completion_date: string | null;
  service_categories: string[];
  short_summary: string;
  long_description: string;
  cover_image_url: string | null;
  cover_media_id: string | null;
  testimonial: string | null;
  testimonial_author: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  media?: SiteProjectMedia[];
};

export type SiteMediaAsset = {
  id: string;
  title: string | null;
  alt_text: string | null;
  file_url: string;
  webp_url: string | null;
  avif_url: string | null;
  thumbnail_url: string | null;
  blur_data_url: string | null;
  width: number | null;
  height: number | null;
};

export type SiteTestimonial = {
  id: string;
  quote: string;
  author: string;
  location: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

export type SiteHomepageSettings = {
  id: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_primary_cta_label: string;
  hero_secondary_cta_label: string;
  trust_microcopy: string;
  trust_statements: string[];
  service_area_content: string;
  closing_cta_headline: string;
  closing_cta_body: string;
  section_order: string[];
  section_visibility: Record<string, boolean>;
  hero_media_id: string | null;
  featured_service_ids: string[];
  featured_project_ids: string[];
  hero_media?: SiteMediaAsset | null;
};

export const PROJECT_CATEGORIES = [
  "estate-cleanup",
  "property-maintenance",
  "auto-detailing",
  "window-detailing",
  "pressure-washing",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  "estate-cleanup": "Estate Cleanup",
  "property-maintenance": "Property Maintenance",
  "auto-detailing": "Auto Detailing",
  "window-detailing": "Window Detailing",
  "pressure-washing": "Pressure Washing",
};

export function parseJsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export function resolveMediaUrl(asset: SiteMediaAsset | null | undefined, preferWebp = true): string | null {
  if (!asset) return null;
  if (preferWebp && asset.webp_url) return asset.webp_url;
  if (asset.thumbnail_url) return asset.thumbnail_url;
  return asset.file_url;
}

export function pricingDisplay(service: Pick<SiteService, "pricing_mode" | "pricing_label">): string | null {
  if (service.pricing_mode === "hidden" || !service.pricing_label.trim()) return null;
  return service.pricing_label;
}
