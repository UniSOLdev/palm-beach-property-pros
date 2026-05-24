#!/usr/bin/env node
/**
 * Apply pending Supabase migrations from supabase/migrations/
 *
 * Preferred: npm run db:push (Supabase CLI linked to project)
 * Production was repaired via apply_migration MCP on 2026-05-24.
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

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

console.log(`[PBPP DB] ${files.length} migration file(s) in supabase/migrations/`);
for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  const lines = sql.split("\n").length;
  console.log(`  • ${file} (${lines} lines)`);
}

console.log("\n[PBPP DB] Pushing via Supabase CLI…");
const result = spawnSync(
  "npx",
  ["supabase", "db", "push", "--project-ref", "pfojtrfkeoeymmtkvijo"],
  { stdio: "inherit", cwd: root, env: process.env },
);

if (result.status !== 0) {
  console.error(
    "\n[PBPP DB] Push failed. Ensure you are logged in: npx supabase login",
  );
  process.exit(result.status ?? 1);
}

console.log("\n[PBPP DB] Migrations applied successfully.");
