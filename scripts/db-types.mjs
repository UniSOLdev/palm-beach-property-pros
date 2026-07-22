#!/usr/bin/env node
/**
 * Regenerate lib/supabase/database.types.ts from the linked Supabase project.
 *
 * Requires: supabase login (or SUPABASE_ACCESS_TOKEN) and project ref in supabase/config.toml
 *
 * Usage:
 *   npm run db:types
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectRef() {
  try {
    const config = readFileSync(join(root, "supabase", "config.toml"), "utf8");
    const match = config.match(/^project_id\s*=\s*["']?([^"'\s]+)["']?/m);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

const projectRef = readProjectRef();
if (!projectRef) {
  console.error("[PBPP DB] Missing project_id in supabase/config.toml");
  process.exit(1);
}

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.error("[PBPP DB] SUPABASE_ACCESS_TOKEN not set. Run: npx supabase login");
  console.error(`[PBPP DB] Then: npm run db:types`);
  process.exit(1);
}

console.log(`[PBPP DB] Generating types for project ${projectRef}…`);
const result = spawnSync(
  "npx",
  [
    "supabase",
    "gen",
    "types",
    "typescript",
    "--project-id",
    projectRef,
    "--schema",
    "public",
  ],
  { cwd: root, encoding: "utf8" },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const outPath = join(root, "lib", "supabase", "database.types.ts");
writeFileSync(outPath, result.stdout);
console.log(`[PBPP DB] Wrote ${outPath}`);
