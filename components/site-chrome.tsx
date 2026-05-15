"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LocalBusinessJsonLd } from "@/components/json-ld";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideMarketing = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      {!hideMarketing ? <LocalBusinessJsonLd /> : null}
      {!hideMarketing ? <SiteHeader /> : null}
      {children}
      {!hideMarketing ? <SiteFooter /> : null}
      {!hideMarketing ? <MobileCtaBar /> : null}
    </>
  );
}
