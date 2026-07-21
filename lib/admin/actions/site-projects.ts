"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/admin/auth";
import type { GalleryPhase, SiteProject } from "@/lib/site-content/types";

export type ProjectInput = {
  title: string;
  slug: string;
  city?: string | null;
  completion_date?: string | null;
  service_categories: string[];
  service_ids?: string[];
  short_summary: string;
  long_description: string;
  cover_image_url?: string | null;
  cover_media_id?: string | null;
  source_job_id?: string | null;
  client_id?: string | null;
  legacy_filesystem_id?: string | null;
  testimonial?: string | null;
  testimonial_author?: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  media: Array<{
    media_asset_id: string;
    gallery_phase: GalleryPhase;
    caption?: string | null;
    sort_order: number;
  }>;
};

function mapProject(row: Record<string, unknown>): SiteProject {
  return {
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
    source_job_id: (row.source_job_id as string) ?? null,
    client_id: (row.client_id as string) ?? null,
    legacy_filesystem_id: (row.legacy_filesystem_id as string) ?? null,
    testimonial: (row.testimonial as string) ?? null,
    testimonial_author: (row.testimonial_author as string) ?? null,
    is_published: Boolean(row.is_published),
    is_featured: Boolean(row.is_featured),
    sort_order: Number(row.sort_order ?? 0),
  };
}

async function syncProjectServices(
  supabase: Awaited<ReturnType<typeof requireOwnerRole>>["supabase"],
  projectId: string,
  serviceIds: string[] | undefined,
) {
  await supabase.from("site_project_services").delete().eq("project_id", projectId);
  const ids = (serviceIds ?? []).filter(Boolean);
  if (!ids.length) return;

  const { error } = await supabase.from("site_project_services").insert(
    ids.map((service_id) => ({ project_id: projectId, service_id })),
  );
  if (error) throw new Error(error.message);
}

async function syncProjectMediaAssets(
  supabase: Awaited<ReturnType<typeof requireOwnerRole>>["supabase"],
  projectId: string,
  media: ProjectInput["media"],
  coverMediaId: string | null,
) {
  const linkedIds = new Set(media.map((item) => item.media_asset_id));

  await supabase.from("media_assets").update({ project_id: null }).eq("project_id", projectId);

  for (const item of media) {
    await supabase
      .from("media_assets")
      .update({
        project_id: projectId,
        gallery_phase: item.gallery_phase,
        is_featured: item.media_asset_id === coverMediaId,
      })
      .eq("id", item.media_asset_id);
  }

  if (coverMediaId && !linkedIds.has(coverMediaId)) {
    await supabase.from("media_assets").update({ project_id: projectId, is_featured: true }).eq("id", coverMediaId);
  }
}

export async function listAdminProjects(): Promise<SiteProject[]> {
  const { supabase } = await requireOwnerRole();
  const { data, error } = await supabase
    .from("site_projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapProject(row as Record<string, unknown>));
}

export async function getAdminProject(id: string) {
  const { supabase } = await requireOwnerRole();
  const { data, error } = await supabase.from("site_projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Project not found");

  const [{ data: mediaRows }, { data: serviceRows }] = await Promise.all([
    supabase
      .from("site_project_media")
      .select("*, media_assets(id, title, file_url, webp_url, thumbnail_url, alt_text)")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase.from("site_project_services").select("service_id").eq("project_id", id),
  ]);

  return {
    project: {
      ...mapProject(data as Record<string, unknown>),
      service_ids: (serviceRows ?? []).map((row) => String(row.service_id)),
    },
    media: mediaRows ?? [],
  };
}

export async function saveProject(input: ProjectInput, id?: string) {
  const { supabase } = await requireOwnerRole();

  const row = {
    title: input.title.trim(),
    slug: input.slug.trim(),
    city: input.city?.trim() || null,
    completion_date: input.completion_date || null,
    service_categories: input.service_categories.filter(Boolean),
    short_summary: input.short_summary.trim(),
    long_description: input.long_description.trim(),
    cover_image_url: input.cover_image_url ?? null,
    cover_media_id: input.cover_media_id ?? null,
    source_job_id: input.source_job_id ?? null,
    client_id: input.client_id ?? null,
    legacy_filesystem_id: input.legacy_filesystem_id ?? null,
    testimonial: input.testimonial?.trim() || null,
    testimonial_author: input.testimonial_author?.trim() || null,
    is_published: input.is_published,
    is_featured: input.is_featured,
    sort_order: input.sort_order,
    updated_at: new Date().toISOString(),
  };

  let projectId = id;
  if (id) {
    const { error } = await supabase.from("site_projects").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("site_projects").insert(row).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Insert failed");
    projectId = String(data.id);
  }

  if (!projectId) throw new Error("Missing project id");

  await supabase.from("site_project_media").delete().eq("project_id", projectId);
  if (input.media.length) {
    const { error: mediaError } = await supabase.from("site_project_media").insert(
      input.media.map((m, i) => ({
        project_id: projectId,
        media_asset_id: m.media_asset_id,
        gallery_phase: m.gallery_phase,
        caption: m.caption?.trim() || null,
        sort_order: m.sort_order ?? i,
      })),
    );
    if (mediaError) throw new Error(mediaError.message);
  }

  await syncProjectServices(supabase, projectId, input.service_ids);
  await syncProjectMediaAssets(supabase, projectId, input.media, input.cover_media_id ?? null);

  revalidatePath("/admin/site/projects");
  revalidatePath("/projects");
  revalidatePath(`/projects/${input.slug}`);
  revalidatePath("/");
  return { id: projectId };
}

export async function duplicateProject(id: string) {
  const { project, media } = await getAdminProject(id);
  return saveProject({
    title: `${project.title} (Copy)`,
    slug: `${project.slug}-copy-${Date.now().toString(36)}`,
    city: project.city,
    completion_date: project.completion_date,
    service_categories: project.service_categories,
    service_ids: project.service_ids,
    short_summary: project.short_summary,
    long_description: project.long_description,
    cover_image_url: project.cover_image_url,
    cover_media_id: project.cover_media_id,
    source_job_id: null,
    client_id: project.client_id ?? null,
    legacy_filesystem_id: null,
    testimonial: project.testimonial,
    testimonial_author: project.testimonial_author,
    is_published: false,
    is_featured: false,
    sort_order: project.sort_order + 1,
    media: (media as Array<{ media_asset_id: string; gallery_phase: GalleryPhase; caption: string | null; sort_order: number }>).map(
      (m) => ({
        media_asset_id: String(m.media_asset_id),
        gallery_phase: (m.gallery_phase as GalleryPhase) ?? "general",
        caption: m.caption,
        sort_order: Number(m.sort_order ?? 0),
      }),
    ),
  });
}

export async function deleteProject(id: string) {
  const { supabase } = await requireOwnerRole();
  const { error } = await supabase.from("site_projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/site/projects");
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function reorderProjects(orderedIds: string[]) {
  const { supabase } = await requireOwnerRole();
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from("site_projects").update({ sort_order: i }).eq("id", orderedIds[i]);
  }
  revalidatePath("/admin/site/projects");
  revalidatePath("/projects");
}
