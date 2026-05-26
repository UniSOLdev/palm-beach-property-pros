import type { Metadata } from "next";
import { PremiumHomePage } from "@/components/marketing/premium-home-page";
import { getHomepageMediaBundle } from "@/lib/media/homepage-media";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Premium Property Operations & Care in Palm Beach County",
  description: `${SITE_NAME} — Residential, commercial, and coastal property services delivered with professional crews, modern systems, and detail-focused execution. Licensed & insured. Palm Beach County based.`,
};

/** Production homepage — locked premium layout (not CMS-overridden). */
export default async function HomePage() {
  const media = await getHomepageMediaBundle();
  return <PremiumHomePage media={media} />;
}
