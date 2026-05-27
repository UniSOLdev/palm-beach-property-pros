"use server";

import { revalidatePath } from "next/cache";
import {
  listMediaForProject,
  listProjects,
  listTransformationPairs,
  type ProjectRow,
  type ResolvedPair,
  type TransformationPairRow,
} from "@/lib/site-builder/queries/content";
import { createClient } from "@/lib/supabase/server";

export async function listProjectsAction(options?: { featuredOnly?: boolean }) {
  const supabase = await createClient();
  return listProjects(supabase, options);
}

export async function getProjectAction(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as ProjectRow | null;
}

export async function listTransformationPairsAction(options?: {
  projectId?: string;
  pairIds?: string[];
}) {
  const supabase = await createClient();
  return listTransformationPairs(supabase, options);
}

export async function saveTransformationPair(input: {
  id?: string;
  project_id: string;
  transformation_id?: string | null;
  title?: string | null;
  label?: string | null;
  before_media_id?: string | null;
  during_media_id?: string | null;
  after_media_id?: string | null;
  sort_order?: number;
}) {
  const supabase = await createClient();
  const payload = {
    project_id: input.project_id,
    transformation_id: input.transformation_id ?? null,
    title: input.title ?? null,
    label: input.label ?? null,
    before_media_id: input.before_media_id ?? null,
    during_media_id: input.during_media_id ?? null,
    after_media_id: input.after_media_id ?? null,
    sort_order: input.sort_order ?? 0,
    updated_at: new Date().toISOString(),
  };

  if (input.before_media_id && input.after_media_id && input.before_media_id === input.after_media_id) {
    throw new Error("Before and after media must be different assets.");
  }

  if (input.id) {
    const { error } = await supabase.from("transformation_pairs").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("transformation_pairs").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/website/transformations");
  revalidatePath("/admin/website/projects");
}

export async function reorderTransformationPairs(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("transformation_pairs")
        .update({ sort_order: index, updated_at: new Date().toISOString() })
        .eq("id", id),
    ),
  );
  revalidatePath("/admin/website/transformations");
}

export async function deleteTransformationPair(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Admin authentication required.");

  const { error } = await supabase
    .from("transformation_pairs")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/website/transformations");
}

export async function listProjectMediaAction(projectId: string) {
  const supabase = await createClient();
  return listMediaForProject(supabase, projectId);
}

export async function upsertProject(input: {
  id?: string;
  slug: string;
  title: string;
  location?: string;
  category?: string;
  summary?: string;
  featured?: boolean;
  turnaround_time?: string;
  service_tags?: string[];
  scope_handled?: string[];
}) {
  const supabase = await createClient();
  const payload = {
    slug: input.slug,
    title: input.title,
    location: input.location ?? null,
    category: input.category ?? null,
    summary: input.summary ?? null,
    featured: input.featured ?? false,
    turnaround_time: input.turnaround_time ?? null,
    service_tags: input.service_tags ?? [],
    scope_handled: input.scope_handled ?? [],
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("projects").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("projects").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/website/projects");
}

export type { ProjectRow, ResolvedPair, TransformationPairRow };
