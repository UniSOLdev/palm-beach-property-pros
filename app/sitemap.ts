import type { MetadataRoute } from "next";
import { CATALOG } from "@/lib/site/catalog";
import { SITE_URL } from "@/lib/site";

/** Bump when public copy changes meaningfully (helps Google recrawl). */
const LAST_UPDATED = new Date("2026-11-20");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, "");
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    lastModified: LAST_UPDATED,
    changeFrequency: "monthly",
    priority,
  });
  return [
    page("/", 1),
    page("/services", 0.9),
    ...CATALOG.map((s) => page(`/services/${s.slug}`, 0.8)),
    page("/holiday-lighting", 0.8),
    page("/arrival-season", 0.7),
    page("/the-dive", 0.6),
    page("/service-area", 0.8),
    page("/quote", 0.7),
    page("/pricing", 0.5),
    page("/privacy", 0.2),
  ];
}
