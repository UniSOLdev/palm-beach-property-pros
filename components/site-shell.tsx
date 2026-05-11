"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isInternalWalkthrough = pathname === "/walkthrough";

  if (isInternalWalkthrough) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 pb-28 pt-6 md:pb-10">{children}</main>
      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
