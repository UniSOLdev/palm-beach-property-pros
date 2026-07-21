import type { Metadata } from "next";
import { PremiumHomePage } from "@/components/marketing/premium-home-page";
import { getHomepageMediaBundle } from "@/lib/media/homepage-media";
import {
  getHomepageSettings,
  getSiteProjects,
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
  const [media, homepage, services, projects, testimonials] = await Promise.all([
    getHomepageMediaBundle(),
    getHomepageSettings(),
    getSiteServices({ featuredOnly: true, activeOnly: true }),
    getSiteProjects({ featuredOnly: true, publishedOnly: true, limit: 6 }),
    getSiteTestimonials(true),
  ]);

  const featuredServices =
    homepage.featured_service_ids.length > 0
      ? services.filter((s) => homepage.featured_service_ids.includes(s.id))
      : services.slice(0, 2);

  const featuredProjects =
    homepage.featured_project_ids.length > 0
      ? projects.filter((p) => homepage.featured_project_ids.includes(p.id))
      : projects;

  return (
    <PremiumHomePage
      media={media}
      homepage={homepage}
      featuredServices={featuredServices.length ? featuredServices : services.slice(0, 2)}
      featuredProjects={featuredProjects}
      testimonials={testimonials}
    />
  );
}
