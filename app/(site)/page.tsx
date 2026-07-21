import type { Metadata } from "next";
import { PremiumHomePage } from "@/components/marketing/premium-home-page";
import { getHomepageMediaBundle } from "@/lib/media/homepage-media";
import { mergeDbProjectsIntoHomepageMedia } from "@/lib/platform/modules/projects";
import {
  getHomepageSettings,
  getSiteProjectsWithMedia,
  getSiteServices,
  getSiteTestimonials,
} from "@/lib/site-content/queries";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Professional Cleaning & Property Care in Palm Beach County",
  description: `${SITE_NAME} — Complete window detailing, pressure washing, property cleanups, lawn care, detailing, and ongoing maintenance in Palm Beach County. Licensed & insured.`,
};

/** Production homepage — premium layout with CMS-editable copy sections. */
export default async function HomePage() {
  const [manifestMedia, homepage, services, publishedProjects, testimonials] = await Promise.all([
    getHomepageMediaBundle(),
    getHomepageSettings(),
    getSiteServices({ featuredOnly: true, activeOnly: true }),
    getSiteProjectsWithMedia({ publishedOnly: true, limit: 12 }),
    getSiteTestimonials(true),
  ]);

  const featuredServices =
    homepage.featured_service_ids.length > 0
      ? services.filter((s) => homepage.featured_service_ids.includes(s.id))
      : services.slice(0, 2);

  const featuredProjects =
    homepage.featured_project_ids.length > 0
      ? publishedProjects.filter((p) => homepage.featured_project_ids.includes(p.id))
      : publishedProjects.filter((p) => p.is_featured).length
        ? publishedProjects.filter((p) => p.is_featured)
        : publishedProjects;

  const media = mergeDbProjectsIntoHomepageMedia(featuredProjects, manifestMedia);

  return (
    <PremiumHomePage
      media={media}
      homepage={homepage}
      featuredServices={featuredServices.length ? featuredServices : services.slice(0, 2)}
      featuredProjects={featuredProjects}
      testimonials={testimonials}
      useDbProjects={featuredProjects.length > 0}
    />
  );
}
