#!/usr/bin/env node
/**
 * Apply pending Supabase migrations from supabase/migrations/
 *
 * Preferred: npm run db:push (Supabase CLI linked to project)
 *
 * Usage:
 *   node scripts/db-push.mjs
 *   npm run db:push
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");

function readProjectRef() {
  try {
    const config = readFileSync(join(root, "supabase", "config.toml"), "utf8");
    const match = config.match(/^project_id\s*=\s*["']?([^"'\s]+)["']?/m);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

console.log(`[PBPP DB] ${files.length} migration file(s) in supabase/migrations/`);
for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  const lines = sql.split("\n").length;
  console.log(`  • ${file} (${lines} lines)`);
}

const projectRef = readProjectRef();
if (projectRef) {
  console.log(`\n[PBPP DB] Project ref: ${projectRef}`);
  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    console.log("[PBPP DB] Tip: set SUPABASE_ACCESS_TOKEN (from supabase login) for non-interactive link/push.");
  }
  spawnSync("npx", ["supabase", "link", "--project-ref", projectRef], {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
}

console.log("\n[PBPP DB] Pushing via Supabase CLI…");
const pushArgs = ["supabase", "db", "push", "--yes"];
if (projectRef) pushArgs.push("--project-ref", projectRef);
const result = spawnSync("npx", pushArgs, {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

if (result.status !== 0) {
  const ref = projectRef ?? "YOUR_PROJECT_REF";
  console.error(`\n[PBPP DB] Push failed. Run: npx supabase login && npx supabase link --project-ref ${ref}`);
  console.error("[PBPP DB] Or apply via Supabase MCP / SQL Editor using files in supabase/migrations/");
  process.exit(result.status ?? 1);
}

console.log("\n[PBPP DB] Migrations applied successfully.");
