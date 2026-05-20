import type { ReactNode } from "react";
import { LocalBusinessJsonLd } from "@/components/json-ld";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LocalBusinessJsonLd />
      <SiteHeader />
      <main className="w-full px-6 pb-32 pt-6 md:pb-14 md:pt-8">{children}</main>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
