import type { SupabaseClient } from "@supabase/supabase-js";

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  category: string | null;
  summary: string | null;
  featured: boolean;
  turnaround_time: string | null;
  hero_media_id: string | null;
  walkthrough_media_id: string | null;
  service_tags: string[];
  scope_handled: string[];
  sort_order: number;
};

export type TransformationPairRow = {
  id: string;
  project_id: string;
  transformation_id: string | null;
  title: string | null;
  label: string | null;
  before_media_id: string | null;
  during_media_id: string | null;
  after_media_id: string | null;
  sort_order: number;
};

export type MediaAssetRow = {
  id: string;
  file_url: string;
  webp_url: string | null;
  thumbnail_url: string | null;
  alt_text: string | null;
  title: string | null;
  media_type: string | null;
  media_category: string | null;
  width: number | null;
  height: number | null;
};

export type ResolvedPair = TransformationPairRow & {
  before?: MediaAssetRow | null;
  during?: MediaAssetRow | null;
  after?: MediaAssetRow | null;
  project?: Pick<ProjectRow, "id" | "title" | "location" | "slug"> | null;
};

function mediaUrl(row?: MediaAssetRow | null) {
  if (!row) return undefined;
  return row.webp_url ?? row.thumbnail_url ?? row.file_url;
}

export async function listProjects(
  supabase: SupabaseClient,
  options?: { featuredOnly?: boolean; includeArchived?: boolean },
) {
  let query = supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!options?.includeArchived) query = query.is("archived_at", null);
  if (options?.featuredOnly) query = query.eq("featured", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectRow[];
}

export async function listTransformationPairs(
  supabase: SupabaseClient,
  options?: {
    projectId?: string;
    pairIds?: string[];
    includeArchived?: boolean;
  },
): Promise<ResolvedPair[]> {
  let query = supabase
    .from("transformation_pairs")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (!options?.includeArchived) query = query.is("archived_at", null);
  if (options?.projectId) query = query.eq("project_id", options.projectId);
  if (options?.pairIds?.length) query = query.in("id", options.pairIds);

  const { data: pairs, error } = await query;
  if (error) throw new Error(error.message);
  if (!pairs?.length) return [];

  const mediaIds = new Set<string>();
  const projectIds = new Set<string>();
  for (const pair of pairs) {
    if (pair.before_media_id) mediaIds.add(pair.before_media_id);
    if (pair.during_media_id) mediaIds.add(pair.during_media_id);
    if (pair.after_media_id) mediaIds.add(pair.after_media_id);
    projectIds.add(pair.project_id);
  }

  const [mediaResult, projectsResult] = await Promise.all([
    mediaIds.size
      ? supabase.from("media_assets").select("*").in("id", [...mediaIds])
      : Promise.resolve({ data: [] as MediaAssetRow[], error: null }),
    projectIds.size
      ? supabase.from("projects").select("id, title, location, slug").in("id", [...projectIds])
      : Promise.resolve({ data: [] as ProjectRow[], error: null }),
  ]);

  if (mediaResult.error) throw new Error(mediaResult.error.message);
  if (projectsResult.error) throw new Error(projectsResult.error.message);

  const mediaMap = new Map((mediaResult.data ?? []).map((m) => [m.id, m as MediaAssetRow]));
  const projectMap = new Map((projectsResult.data ?? []).map((p) => [p.id, p as ProjectRow]));

  return pairs.map((pair) => ({
    ...(pair as TransformationPairRow),
    before: pair.before_media_id ? mediaMap.get(pair.before_media_id) ?? null : null,
    during: pair.during_media_id ? mediaMap.get(pair.during_media_id) ?? null : null,
    after: pair.after_media_id ? mediaMap.get(pair.after_media_id) ?? null : null,
    project: projectMap.get(pair.project_id) ?? null,
  }));
}

export function pairToCompareProps(pair: ResolvedPair) {
  const beforeUrl = mediaUrl(pair.before);
  const afterUrl = mediaUrl(pair.after);
  if (!beforeUrl || !afterUrl) return null;
  return {
    id: pair.id,
    label: pair.label ?? pair.title ?? pair.project?.title ?? "Transformation",
    beforeUrl,
    afterUrl,
    beforeAlt: pair.before?.alt_text ?? "Before",
    afterAlt: pair.after?.alt_text ?? "After",
  };
}

export async function listServicePrograms(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("service_programs")
    .select("*")
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listWorkflowSteps(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("workflow_steps")
    .select("*")
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listDocumentationFeatures(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("documentation_features")
    .select("*")
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listMediaForProject(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MediaAssetRow[];
}
