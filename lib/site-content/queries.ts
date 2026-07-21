import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getServiceBySlug as getStaticService,
  SERVICES as STATIC_SERVICES,
  type ServiceDefinition,
} from "@/lib/services";
import {
  parseJsonArray,
  type GalleryPhase,
  type SiteHomepageSettings,
  type SiteMediaAsset,
  type SiteProject,
  type SiteService,
  type SiteServiceFaq,
  type SiteTestimonial,
} from "@/lib/site-content/types";

function mapMedia(row: Record<string, unknown> | null): SiteMediaAsset | null {
  if (!row) return null;
  return {
    id: String(row.id),
    title: (row.title as string) ?? null,
    alt_text: (row.alt_text as string) ?? null,
    file_url: String(row.file_url),
    webp_url: (row.webp_url as string) ?? null,
    avif_url: (row.avif_url as string) ?? null,
    thumbnail_url: (row.thumbnail_url as string) ?? null,
    blur_data_url: (row.blur_data_url as string) ?? null,
    width: (row.width as number) ?? null,
    height: (row.height as number) ?? null,
  };
}

function mapService(row: Record<string, unknown>, faqs: SiteServiceFaq[] = []): SiteService {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    short_description: String(row.short_description ?? ""),
    headline: String(row.headline ?? ""),
    authority_intro: String(row.authority_intro ?? ""),
    best_for: String(row.best_for ?? ""),
    included: parseJsonArray(row.included),
    add_ons: parseJsonArray(row.add_ons),
    who_its_for: parseJsonArray(row.who_its_for),
    process_steps: parseJsonArray(row.process_steps),
    pricing_mode: (row.pricing_mode as SiteService["pricing_mode"]) ?? "starting_at",
    pricing_label: String(row.pricing_label ?? ""),
    cta_headline: String(row.cta_headline ?? "Request a free estimate"),
    cta_body: String(row.cta_body ?? ""),
    cover_image_url: (row.cover_image_url as string) ?? null,
    cover_media_id: (row.cover_media_id as string) ?? null,
    water_access_note: (row.water_access_note as string) ?? null,
    seo_title: (row.seo_title as string) ?? null,
    seo_description: (row.seo_description as string) ?? null,
    display_order: Number(row.display_order ?? 0),
    is_featured: Boolean(row.is_featured),
    is_active: Boolean(row.is_active),
    faqs,
  };
}

function staticToSiteService(s: ServiceDefinition): SiteService {
  return {
    id: s.slug,
    slug: s.slug,
    title: s.slug === "window-cleaning" ? "Complete Window Detailing" : s.name,
    short_description: s.shortDescription,
    headline: s.slug === "window-cleaning" ? "Complete Window Detailing in Palm Beach County" : s.headline,
    authority_intro: s.authorityIntro,
    best_for: s.bestFor,
    included: [...s.included],
    add_ons: [],
    who_its_for: [...s.whoItsFor],
    process_steps: s.process ? [...s.process] : [],
    pricing_mode: "starting_at",
    pricing_label: s.startingPriceLabel,
    cta_headline: "Request a free estimate",
    cta_body: "",
    cover_image_url: null,
    cover_media_id: null,
    water_access_note:
      s.slug === "pressure-washing"
        ? "PBPP normally connects equipment to your accessible exterior water spigot. Standard water access at the property is expected unless we arrange an alternate setup in advance."
        : null,
    seo_title: null,
    seo_description: null,
    display_order: STATIC_SERVICES.findIndex((x) => x.slug === s.slug),
    is_featured: s.slug === "window-cleaning" || s.slug === "pressure-washing",
    is_active: true,
    faqs: s.faq.map((f, i) => ({
      id: `${s.slug}-faq-${i}`,
      service_id: s.slug,
      question: f.q,
      answer: f.a,
      sort_order: i,
    })),
  };
}

async function getSupabase() {
  try {
    return createServiceClient();
  } catch {
    return await createClient();
  }
}

export async function getSiteServices(options?: {
  featuredOnly?: boolean;
  activeOnly?: boolean;
}): Promise<SiteService[]> {
  try {
    const supabase = await getSupabase();
    let query = supabase.from("site_services").select("*").order("display_order", { ascending: true });
    if (options?.activeOnly !== false) query = query.eq("is_active", true);
    if (options?.featuredOnly) query = query.eq("is_featured", true);

    const { data, error } = await query;
    if (error || !data?.length) {
      let staticList = STATIC_SERVICES.map(staticToSiteService);
      if (options?.featuredOnly) staticList = staticList.filter((s) => s.is_featured);
      return staticList;
    }

    const serviceIds = data.map((r) => r.id as string);
    const { data: faqRows } = await supabase
      .from("site_service_faqs")
      .select("*")
      .in("service_id", serviceIds)
      .order("sort_order", { ascending: true });

    const faqsByService = new Map<string, SiteServiceFaq[]>();
    for (const f of faqRows ?? []) {
      const sid = String(f.service_id);
      const list = faqsByService.get(sid) ?? [];
      list.push({
        id: String(f.id),
        service_id: sid,
        question: String(f.question),
        answer: String(f.answer),
        sort_order: Number(f.sort_order ?? 0),
      });
      faqsByService.set(sid, list);
    }

    return data.map((row) => mapService(row as Record<string, unknown>, faqsByService.get(String(row.id)) ?? []));
  } catch {
    return STATIC_SERVICES.map(staticToSiteService);
  }
}

export async function getSiteServiceBySlug(slug: string): Promise<SiteService | null> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("site_services")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      const s = getStaticService(slug);
      return s ? staticToSiteService(s) : null;
    }

    const { data: faqRows } = await supabase
      .from("site_service_faqs")
      .select("*")
      .eq("service_id", data.id)
      .order("sort_order", { ascending: true });

    const faqs = (faqRows ?? []).map((f) => ({
      id: String(f.id),
      service_id: String(f.service_id),
      question: String(f.question),
      answer: String(f.answer),
      sort_order: Number(f.sort_order ?? 0),
    }));

    return mapService(data as Record<string, unknown>, faqs);
  } catch {
    const s = getStaticService(slug);
    return s ? staticToSiteService(s) : null;
  }
}

export async function getSiteProjects(options?: {
  featuredOnly?: boolean;
  publishedOnly?: boolean;
  serviceCategory?: string;
  limit?: number;
}): Promise<SiteProject[]> {
  try {
    const supabase = await getSupabase();
    let query = supabase.from("site_projects").select("*").order("sort_order", { ascending: true });
    if (options?.publishedOnly !== false) query = query.eq("is_published", true);
    if (options?.featuredOnly) query = query.eq("is_featured", true);
    if (options?.serviceCategory) query = query.contains("service_categories", [options.serviceCategory]);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      slug: String(row.slug),
      city: (row.city as string) ?? null,
      completion_date: (row.completion_date as string) ?? null,
      service_categories: Array.isArray(row.service_categories) ? (row.service_categories as string[]) : [],
      short_summary: String(row.short_summary ?? ""),
      long_description: String(row.long_description ?? ""),
      cover_image_url: (row.cover_image_url as string) ?? null,
      cover_media_id: (row.cover_media_id as string) ?? null,
      testimonial: (row.testimonial as string) ?? null,
      testimonial_author: (row.testimonial_author as string) ?? null,
      is_published: Boolean(row.is_published),
      is_featured: Boolean(row.is_featured),
      sort_order: Number(row.sort_order ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function getSiteProjectBySlug(slug: string): Promise<SiteProject | null> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("site_projects")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) return null;

    const { data: mediaRows } = await supabase
      .from("site_project_media")
      .select("*, media_assets(*)")
      .eq("project_id", data.id)
      .order("sort_order", { ascending: true });

    const project: SiteProject = {
      id: String(data.id),
      title: String(data.title),
      slug: String(data.slug),
      city: (data.city as string) ?? null,
      completion_date: (data.completion_date as string) ?? null,
      service_categories: Array.isArray(data.service_categories) ? (data.service_categories as string[]) : [],
      short_summary: String(data.short_summary ?? ""),
      long_description: String(data.long_description ?? ""),
      cover_image_url: (data.cover_image_url as string) ?? null,
      cover_media_id: (data.cover_media_id as string) ?? null,
      testimonial: (data.testimonial as string) ?? null,
      testimonial_author: (data.testimonial_author as string) ?? null,
      is_published: Boolean(data.is_published),
      is_featured: Boolean(data.is_featured),
      sort_order: Number(data.sort_order ?? 0),
      media: (mediaRows ?? []).map((m) => {
        const assetRow = m.media_assets as Record<string, unknown> | null;
        return {
          id: String(m.id),
          project_id: String(m.project_id),
          media_asset_id: String(m.media_asset_id),
          gallery_phase: (m.gallery_phase as GalleryPhase) ?? "general",
          caption: (m.caption as string) ?? null,
          sort_order: Number(m.sort_order ?? 0),
          media: mapMedia(assetRow),
        };
      }),
    };

    return project;
  } catch {
    return null;
  }
}

const DEFAULT_HOMEPAGE: SiteHomepageSettings = {
  id: "default",
  hero_eyebrow: "Palm Beach Property Pros",
  hero_headline: "Professional Cleaning & Property Care in Palm Beach County",
  hero_subheadline:
    "Complete window detailing, pressure washing, property cleanups, lawn care, detailing, and ongoing maintenance—delivered with clear communication and photo-backed scope.",
  hero_primary_cta_label: "Request a Free Estimate",
  hero_secondary_cta_label: "Call or Text",
  trust_microcopy: "Free estimates • Photo uploads • Clear communication",
  trust_statements: [
    "Licensed & insured",
    "Palm Beach County operations",
    "Documented field execution",
    "Free estimates on request",
  ],
  service_area_content:
    "We serve homeowners, estates, property managers, and commercial clients throughout Palm Beach County.",
  closing_cta_headline: "Ready for a free estimate?",
  closing_cta_body:
    "Share your property details and photos—we respond with scope-based pricing and clear next steps.",
  section_order: [
    "hero",
    "featured_services",
    "trust",
    "featured_projects",
    "testimonials",
    "service_area",
    "closing_cta",
  ],
  section_visibility: {
    hero: true,
    featured_services: true,
    trust: true,
    featured_projects: true,
    testimonials: true,
    service_area: true,
    closing_cta: true,
  },
  hero_media_id: null,
  featured_service_ids: [],
  featured_project_ids: [],
};

export async function getHomepageSettings(): Promise<SiteHomepageSettings> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("site_homepage_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return DEFAULT_HOMEPAGE;

    let heroMedia: SiteMediaAsset | null = null;
    if (data.hero_media_id) {
      const { data: mediaRow } = await supabase
        .from("media_assets")
        .select("*")
        .eq("id", data.hero_media_id)
        .maybeSingle();
      heroMedia = mapMedia(mediaRow as Record<string, unknown> | null);
    }

    return {
      id: String(data.id),
      hero_eyebrow: String(data.hero_eyebrow ?? DEFAULT_HOMEPAGE.hero_eyebrow),
      hero_headline: String(data.hero_headline ?? DEFAULT_HOMEPAGE.hero_headline),
      hero_subheadline: String(data.hero_subheadline ?? DEFAULT_HOMEPAGE.hero_subheadline),
      hero_primary_cta_label: String(data.hero_primary_cta_label ?? DEFAULT_HOMEPAGE.hero_primary_cta_label),
      hero_secondary_cta_label: String(data.hero_secondary_cta_label ?? DEFAULT_HOMEPAGE.hero_secondary_cta_label),
      trust_microcopy: String(data.trust_microcopy ?? DEFAULT_HOMEPAGE.trust_microcopy),
      trust_statements: parseJsonArray(data.trust_statements).length
        ? parseJsonArray(data.trust_statements)
        : DEFAULT_HOMEPAGE.trust_statements,
      service_area_content: String(data.service_area_content ?? DEFAULT_HOMEPAGE.service_area_content),
      closing_cta_headline: String(data.closing_cta_headline ?? DEFAULT_HOMEPAGE.closing_cta_headline),
      closing_cta_body: String(data.closing_cta_body ?? DEFAULT_HOMEPAGE.closing_cta_body),
      section_order: parseJsonArray(data.section_order).length
        ? parseJsonArray(data.section_order)
        : DEFAULT_HOMEPAGE.section_order,
      section_visibility:
        typeof data.section_visibility === "object" && data.section_visibility !== null
          ? (data.section_visibility as Record<string, boolean>)
          : DEFAULT_HOMEPAGE.section_visibility,
      hero_media_id: (data.hero_media_id as string) ?? null,
      featured_service_ids: Array.isArray(data.featured_service_ids)
        ? (data.featured_service_ids as string[])
        : [],
      featured_project_ids: Array.isArray(data.featured_project_ids)
        ? (data.featured_project_ids as string[])
        : [],
      hero_media: heroMedia,
    };
  } catch {
    return DEFAULT_HOMEPAGE;
  }
}

export async function getSiteTestimonials(featuredOnly = false): Promise<SiteTestimonial[]> {
  try {
    const supabase = await getSupabase();
    let query = supabase
      .from("site_testimonials")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (featuredOnly) query = query.eq("is_featured", true);

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => ({
      id: String(row.id),
      quote: String(row.quote),
      author: String(row.author ?? ""),
      location: (row.location as string) ?? null,
      is_featured: Boolean(row.is_featured),
      is_active: Boolean(row.is_active),
      sort_order: Number(row.sort_order ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function getQuoteFormServices(): Promise<Array<{ slug: string; title: string }>> {
  const services = await getSiteServices({ activeOnly: true });
  return services.map((s) => ({ slug: s.slug, title: s.title }));
}

export { DEFAULT_HOMEPAGE };
