import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, "");
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/services`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/quote`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/service-area`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const supabase = createServiceClient();
    const { data: pages } = await supabase
      .from("website_pages")
      .select("slug, updated_at, status")
      .eq("status", "published");

    const cmsRoutes: MetadataRoute.Sitemap = (pages ?? [])
      .filter((p) => p.slug !== "home")
      .map((p) => ({
        url: `${base}/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));

    return [...staticRoutes, ...cmsRoutes];
  } catch {
    return staticRoutes;
  }
}
