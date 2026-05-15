"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import type { MarketingRuntime } from "@/lib/cms-types";
import { LocalBusinessJsonLd } from "@/components/json-ld";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({
  children,
  marketing,
}: {
  children: ReactNode;
  marketing?: MarketingRuntime | null;
}) {
  const pathname = usePathname();
  const hideMarketing = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      {!hideMarketing ? <LocalBusinessJsonLd /> : null}
      {!hideMarketing ? (
        <SiteHeader shell={marketing?.shell ?? null} logoUrl={marketing?.theme?.logo_url ?? null} />
      ) : null}
      {children}
      {!hideMarketing ? (
        <SiteFooter shell={marketing?.shell ?? null} logoUrl={marketing?.theme?.logo_url ?? null} />
      ) : null}
      {!hideMarketing ? <MobileCtaBar shell={marketing?.shell ?? null} /> : null}
    </>
  );
}
