import type { WebsiteGalleryItem, WebsiteHomepageContent, WebsiteProject, WebsiteReview } from "./website-types";

function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  return Boolean(v);
}

function isoDateTime(v: unknown): string {
  if (v == null) return new Date().toISOString();
  return new Date(v as string).toISOString();
}

function isoDate(v: unknown): string | null {
  if (v == null) return null;
  return new Date(v as string).toISOString().slice(0, 10);
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).map((x) => String(x)).filter(Boolean) : [];
}

function uuidArr(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).map((x) => String(x)).filter(Boolean) : [];
}

export function mapWebsiteGalleryRow(row: Record<string, unknown>): WebsiteGalleryItem {
  return {
    id: str(row.id),
    imageUrl: str(row.image_url),
    beforeImageUrl: row.before_image_url ? str(row.before_image_url) : null,
    afterImageUrl: row.after_image_url ? str(row.after_image_url) : null,
    caption: row.caption ? str(row.caption) : null,
    serviceType: row.service_type ? str(row.service_type) : null,
    location: row.location ? str(row.location) : null,
    jobName: row.job_name ? str(row.job_name) : null,
    featured: bool(row.featured),
    sortOrder: num(row.sort_order, 0),
    createdAt: isoDateTime(row.created_at),
  };
}

export function mapWebsiteReviewRow(row: Record<string, unknown>): WebsiteReview {
  return {
    id: str(row.id),
    customerName: str(row.customer_name),
    rating: Math.min(5, Math.max(1, num(row.rating, 5))),
    reviewText: row.review_text ? str(row.review_text) : null,
    serviceType: row.service_type ? str(row.service_type) : null,
    city: row.city ? str(row.city) : null,
    source: row.source ? str(row.source) : null,
    featured: bool(row.featured),
    sortOrder: num(row.sort_order, 0),
    createdAt: isoDateTime(row.created_at),
  };
}

export function mapWebsiteHomepageRow(row: Record<string, unknown>): WebsiteHomepageContent {
  return {
    id: str(row.id),
    heroEyebrow: row.hero_eyebrow ? str(row.hero_eyebrow) : null,
    heroHeadline: row.hero_headline ? str(row.hero_headline) : null,
    heroSubheadline: row.hero_subheadline ? str(row.hero_subheadline) : null,
    primaryCtaText: row.primary_cta_text ? str(row.primary_cta_text) : null,
    primaryCtaLink: row.primary_cta_link ? str(row.primary_cta_link) : null,
    secondaryCtaText: row.secondary_cta_text ? str(row.secondary_cta_text) : null,
    secondaryCtaLink: row.secondary_cta_link ? str(row.secondary_cta_link) : null,
    trustBadges: strArr(row.trust_badges),
    featuredServiceSlugs: strArr(row.featured_service_slugs),
    featuredGalleryIds: uuidArr(row.featured_gallery_ids),
    featuredReviewIds: uuidArr(row.featured_review_ids),
    createdAt: isoDateTime(row.created_at),
  };
}

export function mapWebsiteProjectRow(row: Record<string, unknown>): WebsiteProject {
  return {
    id: str(row.id),
    title: str(row.title),
    serviceType: row.service_type ? str(row.service_type) : null,
    city: row.city ? str(row.city) : null,
    shortDescription: row.short_description ? str(row.short_description) : null,
    beforeImageUrls: strArr(row.before_image_urls),
    afterImageUrls: strArr(row.after_image_urls),
    featuredImageUrl: row.featured_image_url ? str(row.featured_image_url) : null,
    clientName: row.client_name ? str(row.client_name) : null,
    dateCompleted: isoDate(row.date_completed),
    featured: bool(row.featured),
    showOnHomepage: bool(row.show_on_homepage),
    sortOrder: num(row.sort_order, 0),
  };
}
