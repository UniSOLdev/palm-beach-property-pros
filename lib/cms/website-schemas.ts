import { z } from "zod";

export const pageStatusSchema = z.enum(["draft", "published", "archived"]);
export const pageTypeSchema = z.enum([
  "homepage",
  "service",
  "landing",
  "city_seo",
  "gallery",
  "about",
  "contact",
  "page",
]);

export const createPageSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  page_type: pageTypeSchema.default("page"),
});

export const updatePageSeoSchema = z.object({
  pageId: z.string().uuid(),
  slug: z.string().min(1).max(120).optional(),
  seo_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
  og_image_url: z.string().url().optional().or(z.literal("")),
});

export const saveSectionsSchema = z.object({
  pageId: z.string().uuid(),
  sections: z.array(
    z.object({
      id: z.string().uuid(),
      section_type: z.string(),
      label: z.string().nullable(),
      sort_order: z.number().int().min(0),
      is_visible: z.boolean(),
      content: z.record(z.string(), z.unknown()),
    }),
  ),
  seo: z
    .object({
      slug: z.string().optional(),
      seo_title: z.string().optional(),
      meta_description: z.string().optional(),
      og_image_url: z.string().optional(),
    })
    .optional(),
});

export const publishPageSchema = z.object({
  pageId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

export const addSectionSchema = z.object({
  pageId: z.string().uuid(),
  sectionType: z.string().min(1),
});

export const sectionActionSchema = z.object({
  pageId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

export const uploadMediaSchema = z.object({
  pageId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  alt_text: z.string().max(500).optional(),
  caption: z.string().max(1000).optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type SaveSectionsInput = z.infer<typeof saveSectionsSchema>;
export type PublishPageInput = z.infer<typeof publishPageSchema>;

/** Map PostgREST schema errors to operator-friendly messages. */
export function formatSiteStudioError(message: string): string {
  if (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  ) {
    return [
      "Site Studio database tables are not installed in Supabase yet.",
      "Apply migration: supabase/migrations/20260527120000_site_studio_complete.sql",
      "Then reload the Supabase schema cache (Dashboard → Settings → API → Reload).",
    ].join(" ");
  }
  if (message.includes("42501") || message.toLowerCase().includes("permission")) {
    return "Permission denied. Sign in again or verify RLS policies for website tables.";
  }
  return message;
}
