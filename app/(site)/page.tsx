import type { Metadata } from "next";
import { PremiumHomePage } from "@/components/marketing/premium-home-page";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Palm Beach Property Pros | Luxury Property Care, Cleaning & Home Watch" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

/** Production homepage — locked layout (not CMS-overridden). */
export default function HomePage() {
  return <PremiumHomePage />;
}
