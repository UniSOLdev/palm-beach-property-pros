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
];

for (const file of migrations) {
  const sql = readFileSync(join(root, "supabase/migrations", file), "utf8");
  assert(sql.length > 0, `${file} is readable`);
}

const dbFirst = readFileSync(join(root, "supabase/migrations/20260721150000_projects_db_first.sql"), "utf8");
assert(dbFirst.includes("site_project_services"), "db-first migration adds service junction");
assert(dbFirst.includes("source_job_id"), "db-first migration adds job FK");

const importScript = readFileSync(join(root, "scripts/import-manifest-to-db.mjs"), "utf8");
assert(importScript.includes("legacy_filesystem_id"), "import script sets legacy id");
assert(importScript.includes("site_project_media"), "import script links media");

const queries = readFileSync(join(root, "lib/site-content/queries.ts"), "utf8");
assert(queries.includes("getSiteProjectsWithMedia"), "queries expose withMedia loader");

const homepage = readFileSync(join(root, "app/(site)/page.tsx"), "utf8");
assert(homepage.includes("mergeDbProjectsIntoHomepageMedia"), "homepage merges DB projects");

const form = readFileSync(join(root, "components/admin/site-project-form.tsx"), "utf8");
assert(form.includes("ProjectMediaEditor"), "project form includes media editor");

const editPage = readFileSync(join(root, "app/admin/site/projects/[id]/page.tsx"), "utf8");
assert(editPage.includes("getAdminProject"), "edit page loads admin project");
assert(!editPage.includes("media: []"), "edit page passes loaded media");

console.log("\nProject workflow static verification passed.");
