#!/usr/bin/env node
/**
 * Prints cron-job.org setup for PBPP Autopilot (free tier — no Vercel Pro).
 * Run: npm run cron:setup
 *
 * Requires CRON_SECRET and NEXT_PUBLIC_SITE_URL in env (or .env.local).
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1).replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.palmbeachpropertypros.com").replace(
  /\/$/,
  "",
);
const secret = process.env.CRON_SECRET;

const jobs = [
  { name: "PBPP Daily Ops", path: "/api/cron/ops", schedule: "Daily 6:00 AM ET" },
  { name: "PBPP Hourly Lead SLA", path: "/api/cron/ops-hourly", schedule: "Every hour" },
  { name: "PBPP Comms Queue", path: "/api/cron/comms", schedule: "Every 15 minutes" },
  { name: "PBPP Outreach", path: "/api/cron/outreach", schedule: "Weekdays 9:00 AM ET" },
  { name: "PBPP Content", path: "/api/cron/content", schedule: "Mondays 8:00 AM ET" },
  { name: "PBPP Weekly Digest", path: "/api/cron/digest", schedule: "Mondays 7:00 AM ET" },
];

console.log("\n PBPP Autopilot — cron-job.org setup (free)\n");
console.log(`Site: ${siteUrl}`);
console.log(`Auth: Authorization: Bearer <CRON_SECRET>\n`);

if (!secret) {
  console.warn("⚠  CRON_SECRET not set — add it to .env.local and Vercel before creating jobs.\n");
}

for (const job of jobs) {
  const url = `${siteUrl}${job.path}`;
  console.log(`── ${job.name} (${job.schedule})`);
  console.log(`   URL:    ${url}`);
  console.log(`   Method: GET`);
  console.log(`   Header: Authorization: Bearer ${secret || "<CRON_SECRET>"}`);
  if (secret) {
    console.log(`   Test:   curl -s -H "Authorization: Bearer ${secret}" "${url}"`);
  }
  console.log("");
}

console.log("Create free account at https://cron-job.org → Cronjobs → Create");
console.log("Use 'Advanced' → Request headers → Authorization: Bearer <your secret>\n");
