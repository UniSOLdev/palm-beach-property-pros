import type { Metadata } from "next";

import { ClientToolsPlaceholder } from "@/components/client-tools-placeholder";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reviews",
  description: `Leave a review for ${SITE_NAME}. We appreciate feedback after every property care visit.`,
};

export default function ReviewsPage() {
  return <ClientToolsPlaceholder variant="reviews" />;
}
