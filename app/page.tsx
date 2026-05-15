import type { Metadata } from "next";

import { CmsHomepageView } from "@/components/marketing/cms-homepage-view";
import { HomeStaticPage } from "@/components/marketing/home-static-page";
import { getPublishedHomepageSections, getPublishedSeoForKey, getPublishedTheme } from "@/lib/cms-queries";
import { HERO_SUBHEADLINE, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublishedSeoForKey("home");
  return {
    title: seo?.title ?? "Premium Property Operations & Care in Palm Beach County",
    description:
      seo?.description ?? `${SITE_NAME} — ${HERO_SUBHEADLINE} Licensed & insured. Palm Beach County based.`,
    openGraph: seo?.og_image_url
      ? { images: [{ url: seo.og_image_url }] }
      : undefined,
    robots:
      seo?.robots_index === false || seo?.robots_follow === false
        ? {
            index: seo.robots_index !== false,
            follow: seo.robots_follow !== false,
          }
        : undefined,
  };
}

export default async function HomePage() {
  const [sections, theme] = await Promise.all([getPublishedHomepageSections(), getPublishedTheme()]);
  if (sections?.length) {
    return <CmsHomepageView sections={sections} theme={theme} />;
  }
  return <HomeStaticPage />;
}
