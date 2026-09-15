import type { Metadata } from "next";
import { PremiumHomePage } from "@/components/marketing/premium-home-page";
import { getHomepageMediaBundle } from "@/lib/media/homepage-media";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Property Restoration, Cleaning & Maintenance",
  description: `${SITE_NAME} — Property restoration, cleaning, and maintenance for residential and commercial properties in Palm Beach County. No carpentry. Licensed & insured.`,
};

/** Production homepage — locked premium layout (not CMS-overridden). */
export default async function HomePage() {
  const media = await getHomepageMediaBundle();
  return <PremiumHomePage media={media} />;
}
