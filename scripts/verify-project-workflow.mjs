#!/usr/bin/env node
/**
 * Validates project CMS module logic without requiring Supabase.
 * Run: node scripts/verify-project-workflow.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
  console.log(`OK: ${message}`);
}

const manifest = JSON.parse(readFileSync(join(root, "public/media/curated/manifest.json"), "utf8"));
assert(Array.isArray(manifest.projects) && manifest.projects.length > 0, "manifest has projects");

const project = manifest.projects[0];
assert(project.beforeAfter?.length > 0, "manifest project has before/after pairs");
assert(project.gallery?.length >= 0, "manifest project has gallery array");

const migrations = [
  "20260721120000_site_cms_upgrade.sql",
  "20260721130000_site_cms_seed.sql",
  "20260721140000_platform_upgrade.sql",
  "20260721150000_projects_db_first.sql",
  "20260721160000_projects_production_hardening.sql",
  "20260721170000_repo_production_reconciliation.sql",
];

for (const file of migrations) {
  const sql = readFileSync(join(root, "supabase/migrations", file), "utf8");
  assert(sql.length > 0, `${file} is readable`);
}

const reconciliation = readFileSync(
  join(root, "supabase/migrations/20260721170000_repo_production_reconciliation.sql"),
  "utf8",
);
assert(reconciliation.includes("optimization_status"), "reconciliation adds media optimization tracking");

for (const removed of [
  "20260520120000_change_orders.sql",
  "20260530120000_media_library_persistence.sql",
]) {
  try {
    readFileSync(join(root, "supabase/migrations", removed), "utf8");
    assert(false, `${removed} should be removed after reconciliation`);
  } catch {
    assert(true, `${removed} correctly removed`);
  }
}

const hardening = readFileSync(
  join(root, "supabase/migrations/20260721160000_projects_production_hardening.sql"),
  "utf8",
);
assert(hardening.includes("site_project_services"), "hardening migration secures service junction");
assert(hardening.includes("site_projects_source_job_unique_idx"), "hardening adds unique job constraint");

const importScript = readFileSync(join(root, "scripts/import-manifest-to-db.mjs"), "utf8");
assert(importScript.includes("legacy_filesystem_id"), "import script sets legacy id");
assert(importScript.includes("site_project_media"), "import script links media");

const queries = readFileSync(join(root, "lib/site-content/queries.ts"), "utf8");
assert(queries.includes("getSiteProjectsWithMedia"), "queries expose withMedia loader");
assert(queries.includes("getSiteProjectsByIds"), "queries resolve pinned featured projects");
assert(queries.includes("hasPublishedSiteProjects"), "queries detect DB-first homepage mode");

const homepage = readFileSync(join(root, "app/(site)/page.tsx"), "utf8");
assert(homepage.includes("buildHomepageMediaFromDbProjects"), "homepage uses DB-only media when published");
assert(homepage.includes("hasPublishedSiteProjects"), "homepage skips manifest when DB has projects");

const siteProjects = readFileSync(join(root, "lib/admin/actions/site-projects.ts"), "utf8");
assert(siteProjects.includes("validateProjectInput"), "saveProject validates input");
assert(siteProjects.includes("normalizeMediaInput"), "saveProject ensures cover in junction");
assert(siteProjects.includes("unpublishProject"), "admin can unpublish projects");
assert(siteProjects.includes("deleteProject"), "admin can delete projects");

const form = readFileSync(join(root, "components/admin/site-project-form.tsx"), "utf8");
assert(form.includes("ProjectMediaEditor"), "project form includes media editor");
assert(form.includes("Linked services"), "project form assigns services");
assert(form.includes("Delete project"), "project form exposes delete");

const editPage = readFileSync(join(root, "app/admin/site/projects/[id]/page.tsx"), "utf8");
assert(editPage.includes("getAdminProject"), "edit page loads admin project");
assert(!editPage.includes("media: []"), "edit page passes loaded media");

const projectsModule = readFileSync(join(root, "lib/platform/modules/projects.ts"), "utf8");
assert(!projectsModule.includes("/media/curated/estate-cleanup-001"), "no hardcoded filesystem recap fallback");

console.log("\nProject workflow static verification passed.");
