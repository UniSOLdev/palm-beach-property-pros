import type { ReactNode } from "react";
import { LocalBusinessJsonLd } from "@/components/json-ld";
import { AdTags } from "@/components/site/ad-tags";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-clip bg-cream text-charcoal">
      <LocalBusinessJsonLd />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <MobileCtaBar />
      <AdTags />
    </div>
  );
}
