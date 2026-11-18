import type { Metadata } from "next";
import { PremiumHomePage } from "@/components/marketing/premium-home-page";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Home Watch & Household Services | Palm Beach Gardens, Jupiter & Palm Beach" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

/** Production homepage — locked layout (not CMS-overridden). */
export default function HomePage() {
  return <PremiumHomePage />;
}
