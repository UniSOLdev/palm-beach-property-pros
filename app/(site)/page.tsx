import type { Metadata } from "next";
import { PremiumHomePage } from "@/components/marketing/premium-home-page";
import { FaqJsonLd } from "@/components/json-ld";
import { getHomepageMediaBundle } from "@/lib/media/homepage-media";
import { FAQ_ITEMS } from "@/lib/faq";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Property Cleaning & Care in Palm Beach County",
  description: `${SITE_NAME} — Window cleaning, pressure washing, recurring cleaning, property care, and mobile detailing throughout Palm Beach County. Get a free estimate.`,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Property Cleaning & Care`,
    description:
      "One reliable team for window cleaning, pressure washing, residential and commercial cleaning, and property care in Palm Beach County.",
    url: SITE_URL,
    type: "website",
  },
};

/** Production homepage — locked premium layout (not CMS-overridden). */
export default async function HomePage() {
  const media = await getHomepageMediaBundle();
  return (
    <>
      <FaqJsonLd items={FAQ_ITEMS.map((f) => ({ q: f.question, a: f.answer }))} />
      <PremiumHomePage media={media} />
    </>
  );
}
