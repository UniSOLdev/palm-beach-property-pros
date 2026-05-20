#!/usr/bin/env node
/**
 * Ensures the public homepage stays decoupled from CMS.
 * Run: npm run verify:public-homepage
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const errors = [];

function read(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) {
    errors.push(`Missing file: ${rel}`);
    return "";
  }
  return readFileSync(p, "utf8");
}

const homePage = read("app/(site)/page.tsx");
const premium = read("components/marketing/premium-home-page.tsx");

if (homePage.includes("getHomeCmsSections")) {
  errors.push("app/(site)/page.tsx must not import or call getHomeCmsSections()");
}

if (!homePage.includes("PremiumHomePage")) {
  errors.push("app/(site)/page.tsx must render PremiumHomePage");
}

if (premium.includes("getHomeCmsSections") || premium.includes("@/lib/cms/home")) {
  errors.push("components/marketing/premium-home-page.tsx must not use CMS helpers");
}

if (premium.includes("createClient") && premium.includes("supabase")) {
  errors.push("components/marketing/premium-home-page.tsx must not fetch from Supabase");
}

if (errors.length) {
  console.error("Public homepage lock check FAILED:\n");
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log("Public homepage lock check passed.");
