import type { Metadata } from "next";

import { ClientToolsPlaceholder } from "@/components/client-tools-placeholder";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Client Portal",
  description: `${SITE_NAME} client portal — quotes, invoices, and service tools in one place.`,
};

export default function ClientPortalPage() {
  return <ClientToolsPlaceholder variant="portal" />;
}
