import type { MetadataRoute } from "next";
import { getAllFlatServiceSlugs } from "@/lib/service-pages";
import { getAllLocationSlugs } from "@/lib/locations";
import { CASE_STUDIES } from "@/lib/case-studies";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/quote`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/service-area`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = getAllFlatServiceSlugs().map((slug) => ({
    url: `${base}/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const locationRoutes: MetadataRoute.Sitemap = getAllLocationSlugs().map((slug) => ({
    url: `${base}/areas/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const projectRoutes: MetadataRoute.Sitemap = CASE_STUDIES.filter((c) => c.published).map(
    (study) => ({
      url: `${base}/projects/${study.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }),
  );

  const legacyServiceRoutes: MetadataRoute.Sitemap = [
    "carpet-steam-cleaning",
    "trash-can-cleaning",
  ].map((slug) => ({
    url: `${base}/services/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...locationRoutes,
    ...projectRoutes,
    ...legacyServiceRoutes,
  ];
}
