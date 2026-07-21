import type { Metadata } from "next";
import { PremiumHomePage } from "@/components/marketing/premium-home-page";
import { getHomepageMediaBundle } from "@/lib/media/homepage-media";
import {
  buildHomepageMediaFromDbProjects,
  mergeDbProjectsIntoHomepageMedia,
} from "@/lib/platform/modules/projects";
import {
  getHomepageSettings,
  getSiteProjectsByIds,
  getSiteProjectsWithMedia,
  getSiteServices,
  getSiteTestimonials,
  hasPublishedSiteProjects,
} from "@/lib/site-content/queries";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Professional Cleaning & Property Care in Palm Beach County",
  description: `${SITE_NAME} — Complete window detailing, pressure washing, property cleanups, lawn care, detailing, and ongoing maintenance in Palm Beach County. Licensed & insured.`,
};

async function resolveFeaturedProjects(
  homepage: Awaited<ReturnType<typeof getHomepageSettings>>,
  publishedProjects: Awaited<ReturnType<typeof getSiteProjectsWithMedia>>,
) {
  if (homepage.featured_project_ids.length > 0) {
    const pinned = await getSiteProjectsByIds(homepage.featured_project_ids);
    if (pinned.length) return pinned;
  }

  const featured = publishedProjects.filter((project) => project.is_featured);
  return featured.length ? featured : publishedProjects;
}

/** Production homepage — premium layout with CMS-editable copy sections. */
export default async function HomePage() {
  const [homepage, services, testimonials, useDbProjects] = await Promise.all([
    getHomepageSettings(),
    getSiteServices({ featuredOnly: true, activeOnly: true }),
    getSiteTestimonials(true),
    hasPublishedSiteProjects(),
  ]);

  const publishedProjects = useDbProjects
    ? await getSiteProjectsWithMedia({ publishedOnly: true, limit: 24 })
    : [];

  const featuredProjects = useDbProjects
    ? await resolveFeaturedProjects(homepage, publishedProjects)
    : [];

  const manifestMedia = useDbProjects ? null : await getHomepageMediaBundle();
  const media = useDbProjects
    ? buildHomepageMediaFromDbProjects(featuredProjects)
    : mergeDbProjectsIntoHomepageMedia([], manifestMedia!);

  const featuredServices =
    homepage.featured_service_ids.length > 0
      ? services.filter((s) => homepage.featured_service_ids.includes(s.id))
      : services.slice(0, 2);

  return (
    <PremiumHomePage
      media={media}
      homepage={homepage}
      featuredServices={featuredServices.length ? featuredServices : services.slice(0, 2)}
      featuredProjects={featuredProjects}
      testimonials={testimonials}
      useDbProjects={useDbProjects}
    />
  );
}
