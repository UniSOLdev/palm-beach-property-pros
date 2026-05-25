import type { ReactNode } from "react";
import { LocalBusinessJsonLd } from "@/components/json-ld";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-hidden">
      <LocalBusinessJsonLd />
      <SiteHeader />
      <main className="w-full max-w-[100vw] px-4 pb-24 pt-5 sm:px-6 md:max-w-none md:px-6 md:pb-14 md:pt-8 max-md:pb-[max(6rem,env(safe-area-inset-bottom,0px))]">
        {children}
      </main>
      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
}
