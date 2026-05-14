import type { ReactNode } from "react";
import { LocalBusinessJsonLd } from "@/components/json-ld";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LocalBusinessJsonLd />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-28 pt-6 md:pb-10">{children}</main>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
