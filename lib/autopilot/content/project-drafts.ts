import "server-only";
import { generateProjectPageDraft } from "@/lib/autopilot/content/draft-generator";
import { createServiceClient } from "@/lib/supabase/service";

type JobRow = {
  id: string;
  service_type: string;
  address: string;
  job_date: string;
  status: string;
  before_photo_urls: string[] | null;
  after_photo_urls: string[] | null;
  job_notes: string | null;
};

type JobPhotoRow = {
  job_id: string;
  category: string;
  file_url: string;
};

type TransformationPairRow = {
  id: string;
  project_id: string;
  title: string | null;
  label: string | null;
  before_media_id: string | null;
  after_media_id: string | null;
  created_at: string;
};

type MediaAssetRow = {
  id: string;
  file_url: string;
  webp_url: string | null;
  thumbnail_url: string | null;
};

function mediaUrl(row?: MediaAssetRow | null) {
  if (!row) return undefined;
  return row.webp_url ?? row.thumbnail_url ?? row.file_url;
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function photosForJob(job: JobRow, photos: JobPhotoRow[]) {
  const jobPhotos = photos.filter((p) => p.job_id === job.id);
  const beforeUrls = [
    ...jobPhotos.filter((p) => p.category === "before").map((p) => p.file_url),
    ...(job.before_photo_urls ?? []),
  ].filter(Boolean);
  const afterUrls = [
    ...jobPhotos.filter((p) => p.category === "after").map((p) => p.file_url),
    ...(job.after_photo_urls ?? []),
  ].filter(Boolean);
  return { beforeUrls, afterUrls };
}

async function existingDraftKeys(supabase: ReturnType<typeof createServiceClient>, keys: string[]) {
  if (!keys.length) return new Set<string>();
  const { data } = await supabase.from("content_drafts").select("draft_key").in("draft_key", keys);
  return new Set((data ?? []).map((row) => row.draft_key));
}

export async function scanJobProjectDrafts(options?: { lookbackDays?: number }) {
  const lookbackDays = options?.lookbackDays ?? 7;
  const supabase = createServiceClient();
  const since = daysAgoIso(lookbackDays);

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      "id, service_type, address, job_date, status, before_photo_urls, after_photo_urls, job_notes",
    )
    .eq("archived", false)
    .eq("status", "completed")
    .gte("job_date", since)
    .order("job_date", { ascending: false });

  if (error) throw new Error(error.message);
  const jobRows = (jobs ?? []) as JobRow[];
  if (!jobRows.length) return { created: 0, skipped: 0, draftIds: [] as string[] };

  const jobIds = jobRows.map((j) => j.id);
  const { data: photoRows } = await supabase
    .from("job_photos")
    .select("job_id, category, file_url")
    .in("job_id", jobIds);

  const photos = (photoRows ?? []) as JobPhotoRow[];
  const candidates = jobRows
    .map((job) => {
      const { beforeUrls, afterUrls } = photosForJob(job, photos);
      if (!beforeUrls.length || !afterUrls.length) return null;
      return generateProjectPageDraft({
        jobId: job.id,
        title: `${job.service_type} — ${job.address.split(",")[0]?.trim() || job.address}`,
        serviceType: job.service_type,
        address: job.address,
        beforeUrls,
        afterUrls,
        summary: job.job_notes ?? undefined,
      });
    })
    .filter(Boolean);

  const keys = candidates.map((c) => c!.draft_key);
  const existing = await existingDraftKeys(supabase, keys);

  let created = 0;
  let skipped = 0;
  const draftIds: string[] = [];

  for (const draft of candidates) {
    if (!draft || existing.has(draft.draft_key)) {
      skipped += 1;
      continue;
    }

    const { data, error: insertError } = await supabase
      .from("content_drafts")
      .insert({
        draft_key: draft.draft_key,
        draft_type: draft.draft_type,
        title: draft.title,
        status: "pending_review",
        content: draft.content,
        source_entity_type: draft.source_entity_type ?? null,
        source_entity_id: draft.source_entity_id ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        skipped += 1;
        continue;
      }
      throw new Error(insertError.message);
    }

    created += 1;
    draftIds.push(data.id);
  }

  return { created, skipped, draftIds };
}

export async function scanTransformationProjectDrafts(options?: { lookbackDays?: number }) {
  const lookbackDays = options?.lookbackDays ?? 30;
  const supabase = createServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const { data: pairs, error } = await supabase
    .from("transformation_pairs")
    .select("id, project_id, title, label, before_media_id, after_media_id, created_at")
    .is("deleted_at", null)
    .is("archived_at", null)
    .not("before_media_id", "is", null)
    .not("after_media_id", "is", null)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const pairRows = (pairs ?? []) as TransformationPairRow[];
  if (!pairRows.length) return { created: 0, skipped: 0, draftIds: [] as string[] };

  const mediaIds = [
    ...new Set(
      pairRows.flatMap((p) => [p.before_media_id, p.after_media_id].filter(Boolean) as string[]),
    ),
  ];

  const [{ data: mediaRows }, { data: projects }] = await Promise.all([
    supabase
      .from("media_assets")
      .select("id, file_url, webp_url, thumbnail_url")
      .in("id", mediaIds),
    supabase.from("projects").select("id, title, location, summary").in(
      "id",
      [...new Set(pairRows.map((p) => p.project_id))],
    ),
  ]);

  const mediaById = new Map((mediaRows ?? []).map((m) => [m.id, m as MediaAssetRow]));
  const projectById = new Map(
    (projects ?? []).map((p) => [
      p.id,
      p as { id: string; title: string; location: string | null; summary: string | null },
    ]),
  );

  const candidates = pairRows
    .map((pair) => {
      const before = mediaById.get(pair.before_media_id!);
      const after = mediaById.get(pair.after_media_id!);
      const beforeUrl = mediaUrl(before);
      const afterUrl = mediaUrl(after);
      if (!beforeUrl || !afterUrl) return null;

      const project = projectById.get(pair.project_id);
      const label = pair.title || pair.label || project?.title || "Transformation";

      return generateProjectPageDraft({
        pairId: pair.id,
        title: label,
        address: project?.location ?? undefined,
        beforeUrls: [beforeUrl],
        afterUrls: [afterUrl],
        summary: project?.summary ?? undefined,
        serviceType: project?.title,
      });
    })
    .filter(Boolean);

  const keys = candidates.map((c) => c!.draft_key);
  const existing = await existingDraftKeys(supabase, keys);

  let created = 0;
  let skipped = 0;
  const draftIds: string[] = [];

  for (const draft of candidates) {
    if (!draft || existing.has(draft.draft_key)) {
      skipped += 1;
      continue;
    }

    const { data, error: insertError } = await supabase
      .from("content_drafts")
      .insert({
        draft_key: draft.draft_key,
        draft_type: draft.draft_type,
        title: draft.title,
        status: "pending_review",
        content: draft.content,
        source_entity_type: draft.source_entity_type ?? null,
        source_entity_id: draft.source_entity_id ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        skipped += 1;
        continue;
      }
      throw new Error(insertError.message);
    }

    created += 1;
    draftIds.push(data.id);
  }

  return { created, skipped, draftIds };
}
