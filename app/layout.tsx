import "./globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import heroManifest from "@/lib/site/hero-manifest.json";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Home Watch & Household Services in the Palm Beaches`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} | Your home, quietly cared for`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [{ url: `${heroManifest.base}/og.jpg`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [`${heroManifest.base}/og.jpg`],
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#081A2E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className={`${sans.className} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
