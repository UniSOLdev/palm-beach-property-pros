"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/admin/auth";
import { saveProject } from "@/lib/admin/actions/site-projects";
import type { GalleryPhase } from "@/lib/site-content/types";

const DIVISION_TO_CATEGORIES: Record<string, string[]> = {
  exterior: ["property-maintenance", "pressure-washing", "window-detailing"],
  interior: ["property-maintenance"],
  "property-support": ["estate-cleanup", "property-maintenance"],
};

export async function publishJobAsProject(input: {
  jobId: string;
  title: string;
  description: string;
  notes?: string;
  coverPhotoUrl?: string | null;
}) {
  const { supabase } = await requireOwnerRole();

  const [{ data: job, error }, { data: photos }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, client_id, service_type, address, city, job_date")
      .eq("id", input.jobId)
      .single(),
    supabase
      .from("job_photos")
      .select("id, category, storage_path, file_url")
      .eq("job_id", input.jobId)
      .order("created_at", { ascending: true }),
  ]);

  if (error || !job) throw new Error(error?.message ?? "Job not found");

  const slug = `${input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;

  const categoryMap: Record<string, string> = {
    window: "window-detailing",
    pressure: "pressure-washing",
    detail: "auto-detailing",
  };

  const lowerService = String(job.service_type).toLowerCase();
  const categories = Object.entries(categoryMap)
    .filter(([key]) => lowerService.includes(key))
    .map(([, value]) => value);

  if (!categories.length) categories.push("property-maintenance");

  const media: Array<{
    media_asset_id: string;
    gallery_phase: GalleryPhase;
    sort_order: number;
  }> = [];

  let coverMediaId: string | null = null;

  for (const [index, photo] of (photos ?? []).entries()) {
    const phase: GalleryPhase =
      photo.category === "before" ? "before" : photo.category === "after" ? "after" : "general";

    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .insert({
        title: `${input.title} — ${photo.category}`,
        file_url: photo.file_url,
        storage_path: photo.storage_path || null,
        file_type: "image",
        optimization_status: "skipped",
        tags: ["field-workflow", `job:${input.jobId}`],
        sort_order: index,
        is_featured: photo.file_url === input.coverPhotoUrl,
        job_reference: input.jobId,
      })
      .select("id")
      .single();

    if (assetError || !asset) throw new Error(assetError?.message ?? "Could not save project photo");

    if (photo.file_url === input.coverPhotoUrl || (!coverMediaId && phase === "after")) {
      coverMediaId = asset.id;
    }

    media.push({
      media_asset_id: asset.id,
      gallery_phase: phase,
      sort_order: index,
    });
  }

  const coverPhotoUrl =
    input.coverPhotoUrl ??
    (photos ?? []).find((photo) => photo.category === "after")?.file_url ??
    (photos ?? [])[0]?.file_url ??
    null;

  if (!coverMediaId && media[0]) {
    coverMediaId = media[0].media_asset_id;
  }

  await saveProject({
    title: input.title.trim(),
    slug,
    city: job.city ?? null,
    completion_date: job.job_date,
    service_categories: categories,
    short_summary: input.description.slice(0, 240),
    long_description: [input.description, input.notes?.trim()].filter(Boolean).join("\n\n"),
    cover_image_url: coverPhotoUrl,
    cover_media_id: coverMediaId,
    source_job_id: job.id,
    client_id: job.client_id ?? null,
    is_published: false,
    is_featured: false,
    sort_order: 0,
    media,
  });

  revalidatePath("/admin/site/projects");
  revalidatePath(`/admin/jobs/${input.jobId}/field`);
  revalidatePath("/projects");

  return { slug };
}
