#!/usr/bin/env node
/**
 * One-time import: filesystem curated manifest → site_projects + media_assets + site_project_media
 *
 * Usage:
 *   node scripts/import-manifest-to-db.mjs
 *   node scripts/import-manifest-to-db.mjs --publish
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "public/media/curated/manifest.json");
const publish = process.argv.includes("--publish");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function divisionToCategories(division) {
  if (division === "exterior") return ["estate-cleanup", "property-maintenance"];
  if (division === "interior") return ["property-maintenance"];
  return ["estate-cleanup", "property-maintenance"];
}

async function upsertAsset(src, meta) {
  const fileUrl = src.startsWith("http") ? src : src;
  const { data: existing } = await supabase
    .from("media_assets")
    .select("id")
    .eq("file_url", fileUrl)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      title: meta.title,
      alt_text: meta.alt,
      file_url: fileUrl,
      webp_url: fileUrl.endsWith(".webp") ? fileUrl : null,
      blur_data_url: meta.blurDataURL ?? null,
      width: meta.width ?? null,
      height: meta.height ?? null,
      file_type: "image",
      optimization_status: "complete",
      tags: ["manifest-import", meta.projectId],
      sort_order: 0,
      is_public: true,
      gallery_phase: meta.phase,
      before_after_group: meta.beforeAfterGroup ?? null,
      before_after_role: meta.beforeAfterRole ?? null,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? `Could not insert asset ${fileUrl}`);
  return data.id;
}

async function importProject(project, sortOrder) {
  const slug = slugify(project.id);
  const categories = divisionToCategories(project.division);

  const { data: existing } = await supabase
    .from("site_projects")
    .select("id")
    .eq("legacy_filesystem_id", project.id)
    .maybeSingle();

  const row = {
    title: project.title,
    slug,
    city: project.location ?? null,
    completion_date: null,
    service_categories: categories,
    short_summary: project.summary ?? "",
    long_description: [project.summary, ...(project.scope ?? [])].filter(Boolean).join("\n\n"),
    is_published: publish,
    is_featured: sortOrder === 0,
    sort_order: sortOrder,
    legacy_filesystem_id: project.id,
    updated_at: new Date().toISOString(),
  };

  let projectId = existing?.id;
  if (projectId) {
    const { error } = await supabase.from("site_projects").update(row).eq("id", projectId);
    if (error) throw new Error(error.message);
    await supabase.from("site_project_media").delete().eq("project_id", projectId);
  } else {
    const { data, error } = await supabase.from("site_projects").insert(row).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Project insert failed");
    projectId = data.id;
  }

  const mediaRows = [];
  let sort = 0;
  let coverMediaId = null;

  for (const pair of project.beforeAfter ?? []) {
    const groupId = pair.id;
    const beforeId = await upsertAsset(pair.before.src, {
      title: `${project.title} — before`,
      alt: pair.before.alt,
      blurDataURL: pair.before.blurDataURL,
      width: pair.before.width,
      height: pair.before.height,
      projectId: project.id,
      phase: "before",
      beforeAfterGroup: groupId,
      beforeAfterRole: "before",
    });
    const afterId = await upsertAsset(pair.after.src, {
      title: `${project.title} — after`,
      alt: pair.after.alt,
      blurDataURL: pair.after.blurDataURL,
      width: pair.after.width,
      height: pair.after.height,
      projectId: project.id,
      phase: "after",
      beforeAfterGroup: groupId,
      beforeAfterRole: "after",
    });

    mediaRows.push(
      { media_asset_id: beforeId, gallery_phase: "before", sort_order: sort++ },
      { media_asset_id: afterId, gallery_phase: "after", sort_order: sort++ },
    );
    if (!coverMediaId) coverMediaId = afterId;
  }

  for (const image of project.gallery ?? []) {
    const assetId = await upsertAsset(image.src, {
      title: `${project.title} — gallery`,
      alt: image.alt,
      blurDataURL: image.blurDataURL,
      width: image.width,
      height: image.height,
      projectId: project.id,
      phase: image.role === "before" ? "before" : image.role === "after" ? "after" : "general",
    });
    mediaRows.push({
      media_asset_id: assetId,
      gallery_phase: image.role === "before" ? "before" : image.role === "after" ? "after" : "general",
      sort_order: sort++,
    });
  }

  if (mediaRows.length) {
    const { error } = await supabase.from("site_project_media").insert(
      mediaRows.map((item) => ({
        project_id: projectId,
        ...item,
      })),
    );
    if (error) throw new Error(error.message);
  }

  const coverSrc = project.beforeAfter?.[0]?.after?.src ?? project.gallery?.[0]?.src ?? null;
  await supabase
    .from("site_projects")
    .update({
      cover_media_id: coverMediaId,
      cover_image_url: coverSrc,
    })
    .eq("id", projectId);

  console.log(`  ✓ ${project.title} → ${slug} (${mediaRows.length} media)`);
  return projectId;
}

async function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  console.log(`Importing ${manifest.projects.length} manifest project(s) ${publish ? "(publish)" : "(draft)"}`);

  for (const [index, project] of manifest.projects.entries()) {
    await importProject(project, index);
  }

  console.log("Done. Run with --publish to mark imported projects as published.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
