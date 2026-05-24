"use server";

import { revalidatePath } from "next/cache";
import {
  defaultContentForType,
  type WebsiteSectionRow,
  type WebsiteSectionType,
} from "@/lib/cms/section-registry";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type BuilderPageBundle = {
  page: {
    id: string;
    slug: string;
    title: string;
    page_type: string;
    seo_title: string | null;
    meta_description: string | null;
    og_image_url: string | null;
    preview_token: string;
    status: string;
    published_at: string | null;
  };
  sections: WebsiteSectionRow[];
  theme: Record<string, unknown>;
  publishVersions: Array<{ id: string; version_number: number; created_at: string; note: string | null }>;
};

export async function listWebsitePages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("website_pages")
    .select("id, slug, title, page_type, status, updated_at, published_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBuilderPage(pageId: string): Promise<BuilderPageBundle> {
  const supabase = await createClient();
  const { data: page, error } = await supabase.from("website_pages").select("*").eq("id", pageId).single();
  if (error || !page) throw new Error(error?.message ?? "Page not found");

  const [{ data: sections }, { data: theme }, { data: versions }] = await Promise.all([
    supabase.from("website_sections").select("*").eq("page_id", pageId).order("sort_order"),
    supabase.from("website_theme").select("tokens, dark_mode_enabled").eq("id", "default").maybeSingle(),
    supabase
      .from("website_publish_history")
      .select("id, version_number, created_at, note")
      .eq("page_id", pageId)
      .order("version_number", { ascending: false })
      .limit(10),
  ]);

  return {
    page: page as BuilderPageBundle["page"],
    sections: (sections ?? []) as WebsiteSectionRow[],
    theme: {
      ...(theme?.tokens as Record<string, unknown> ?? {}),
      darkMode: theme?.dark_mode_enabled ?? false,
    },
    publishVersions: versions ?? [],
  };
}

export async function getBuilderPageBySlug(slug: string) {
  const supabase = await createClient();
  const { data: page } = await supabase.from("website_pages").select("id").eq("slug", slug).maybeSingle();
  if (!page) throw new Error("Page not found");
  return getBuilderPage(page.id);
}

export async function saveDraftSections(
  pageId: string,
  sections: Array<{
    id: string;
    section_type: WebsiteSectionType;
    label: string | null;
    sort_order: number;
    is_visible: boolean;
    content: Record<string, unknown>;
  }>,
  seo?: { seo_title?: string; meta_description?: string; og_image_url?: string },
) {
  const supabase = await createClient();

  for (const section of sections) {
    const { error } = await supabase
      .from("website_sections")
      .update({
        section_type: section.section_type,
        label: section.label,
        sort_order: section.sort_order,
        is_visible: section.is_visible,
        content: section.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", section.id)
      .eq("page_id", pageId);
    if (error) throw new Error(error.message);
  }

  if (seo) {
    const { error } = await supabase
      .from("website_pages")
      .update({ ...seo, updated_at: new Date().toISOString(), status: "draft" })
      .eq("id", pageId);
    if (error) throw new Error(error.message);
  } else {
    await supabase
      .from("website_pages")
      .update({ updated_at: new Date().toISOString(), status: "draft" })
      .eq("id", pageId);
  }

  revalidatePath("/admin/website");
  revalidatePath(`/admin/website/builder/${pageId}`);
}

export async function addWebsiteSection(pageId: string, sectionType: WebsiteSectionType) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("website_sections")
    .select("id", { count: "exact", head: true })
    .eq("page_id", pageId);

  const { data, error } = await supabase
    .from("website_sections")
    .insert({
      page_id: pageId,
      section_type: sectionType,
      label: sectionType.replace(/_/g, " "),
      sort_order: count ?? 0,
      content: defaultContentForType(sectionType),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/website/builder/${pageId}`);
  return data as WebsiteSectionRow;
}

export async function deleteWebsiteSection(sectionId: string, pageId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("website_sections").delete().eq("id", sectionId).eq("page_id", pageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/website/builder/${pageId}`);
}

export async function duplicateWebsiteSection(sectionId: string, pageId: string) {
  const supabase = await createClient();
  const { data: source, error } = await supabase
    .from("website_sections")
    .select("*")
    .eq("id", sectionId)
    .single();
  if (error || !source) throw new Error(error?.message ?? "Section not found");

  const { data, error: insertError } = await supabase
    .from("website_sections")
    .insert({
      page_id: pageId,
      section_type: source.section_type,
      label: `${source.label ?? source.section_type} (copy)`,
      sort_order: source.sort_order + 1,
      is_visible: source.is_visible,
      content: source.content,
    })
    .select("*")
    .single();

  if (insertError) throw new Error(insertError.message);
  revalidatePath(`/admin/website/builder/${pageId}`);
  return data as WebsiteSectionRow;
}

export async function publishWebsitePage(pageId: string, note?: string) {
  const supabase = await createClient();
  const bundle = await getBuilderPage(pageId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lastVersion } = await supabase
    .from("website_publish_history")
    .select("version_number")
    .eq("page_id", pageId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = (lastVersion?.version_number ?? 0) + 1;
  const snapshot = {
    page: bundle.page,
    sections: bundle.sections.filter((s) => s.is_visible),
    theme: bundle.theme,
    publishedAt: new Date().toISOString(),
  };

  const { error: historyError } = await supabase.from("website_publish_history").insert({
    page_id: pageId,
    version_number: versionNumber,
    snapshot,
    published_by: user?.id ?? null,
    note: note ?? null,
  });
  if (historyError) throw new Error(historyError.message);

  const { error: pageError } = await supabase
    .from("website_pages")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId);
  if (pageError) throw new Error(pageError.message);

  revalidatePath("/");
  revalidatePath("/admin/website");
  revalidatePath(`/admin/website/builder/${pageId}`);
  return { versionNumber };
}

export async function rollbackWebsitePage(pageId: string, historyId: string) {
  const supabase = await createClient();
  const { data: history, error } = await supabase
    .from("website_publish_history")
    .select("snapshot, version_number")
    .eq("id", historyId)
    .eq("page_id", pageId)
    .single();
  if (error || !history) throw new Error(error?.message ?? "Version not found");

  const snapshot = history.snapshot as {
    page?: Record<string, unknown>;
    sections?: WebsiteSectionRow[];
  };

  if (snapshot.page) {
    await supabase
      .from("website_pages")
      .update({
        seo_title: snapshot.page.seo_title as string | null,
        meta_description: snapshot.page.meta_description as string | null,
        og_image_url: snapshot.page.og_image_url as string | null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId);
  }

  if (snapshot.sections?.length) {
    await supabase.from("website_sections").delete().eq("page_id", pageId);
    await supabase.from("website_sections").insert(
      snapshot.sections.map((s) => ({
        page_id: pageId,
        section_type: s.section_type,
        label: s.label,
        sort_order: s.sort_order,
        is_visible: s.is_visible,
        content: s.content,
      })),
    );
  }

  revalidatePath(`/admin/website/builder/${pageId}`);
  return { versionNumber: history.version_number };
}

export async function saveWebsiteTheme(tokens: Record<string, unknown>, darkMode: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("website_theme")
    .upsert({
      id: "default",
      tokens,
      dark_mode_enabled: darkMode,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/website");
}

/** Preview draft by token — service role read */
export async function getPreviewPageByToken(token: string) {
  const supabase = createServiceClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("preview_token", token)
    .maybeSingle();
  if (!page) return null;

  const [{ data: sections }, { data: theme }] = await Promise.all([
    supabase.from("website_sections").select("*").eq("page_id", page.id).order("sort_order"),
    supabase.from("website_theme").select("tokens, dark_mode_enabled").eq("id", "default").maybeSingle(),
  ]);

  return {
    page,
    sections: sections ?? [],
    theme: {
      ...(theme?.tokens as Record<string, unknown> ?? {}),
      darkMode: theme?.dark_mode_enabled ?? false,
    },
  };
}

/** Published snapshot for public site (when publish workflow enabled) */
export async function getPublishedPage(slug: string) {
  const supabase = createServiceClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!page) return null;

  const { data: history } = await supabase
    .from("website_publish_history")
    .select("snapshot")
    .eq("page_id", page.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!history?.snapshot) return null;
  return history.snapshot as {
    page: Record<string, unknown>;
    sections: WebsiteSectionRow[];
    theme: Record<string, unknown>;
  };
}

export async function createWebsitePage(input: {
  slug: string;
  title: string;
  page_type: string;
}) {
  const supabase = await createClient();
  const slug = input.slug.trim().replace(/^\//, "").toLowerCase();
  const { data, error } = await supabase
    .from("website_pages")
    .insert({
      slug,
      title: input.title.trim(),
      page_type: input.page_type,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/website/pages");
  return data.id as string;
}
