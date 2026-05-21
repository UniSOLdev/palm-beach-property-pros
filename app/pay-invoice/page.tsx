import type { Metadata } from "next";

import { ClientToolsPlaceholder } from "@/components/client-tools-placeholder";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pay Invoice",
  description: `Pay your ${SITE_NAME} invoice securely. Client payment tools are being upgraded on the PBPP platform.`,
};

export default function PayInvoicePage() {
  return <ClientToolsPlaceholder variant="pay-invoice" />;
}
