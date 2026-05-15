import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const SITE_DESCRIPTION =
  "Premium Palm Beach County property operations: luxury-level exterior and interior care, turnovers, maintenance, and recurring property care plans—licensed, insured, and system-driven.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Premium Property Operations in Palm Beach County`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
};

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body className={`${sans.className} min-h-screen antialiased`}>
        <SiteChrome>
          <main className="mx-auto w-full max-w-6xl px-6 pb-28 pt-6 md:pb-10">{children}</main>
        </SiteChrome>
      </body>
    </html>
  );
}
