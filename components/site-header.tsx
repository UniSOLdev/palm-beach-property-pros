"use client";

import Link from "next/link";
import { useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { defaultHeaderNav } from "@/lib/cms-defaults";
import type { CmsSiteShellPublished } from "@/lib/cms-types";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export type SiteHeaderProps = {
  shell?: CmsSiteShellPublished | null;
  logoUrl?: string | null;
};

export function SiteHeader({ shell, logoUrl }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const navItems = shell?.header_nav?.length ? shell.header_nav : defaultHeaderNav();
  const quote = shell?.quote_button ?? { label: "Get Free Quote", href: LINKR_URL, external: true };
  const call = shell?.header_call ?? { label: "Call or Text", href: PHONE_TEL };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-graphite/75 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl backdrop-saturate-150">
      <nav
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-2.5 sm:gap-4 sm:px-6 sm:py-3"
        aria-label="Primary"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <BrandLogo variant="header" surface="dark" logoSrc={logoUrl} />
          <span className="hidden min-w-0 border-l border-white/[0.08] pl-3 text-[9px] font-medium uppercase leading-[1.35] tracking-[0.2em] text-silver/70 lg:block">
            Premium property
            <span className="block text-silver/50">operations</span>
          </span>
        </div>

        <div className="hidden items-center gap-1 md:flex lg:gap-0.5">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[13px] font-medium tracking-[0.02em] text-cream/80 no-underline transition-colors hover:bg-white/[0.04] hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {quote.external ? (
            <a
              href={quote.href}
              target="_blank"
              rel={linkrRel}
              className="btn-primary-lg hidden px-4 py-2 text-[13px] sm:inline-flex"
            >
              {quote.label}
            </a>
          ) : (
            <Link
              href={quote.href}
              className="btn-primary-lg hidden px-4 py-2 text-[13px] sm:inline-flex"
            >
              {quote.label}
            </Link>
          )}
          <a
            href={call.href}
            className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-medium tracking-wide text-cream/85 no-underline transition hover:border-aqua/35 hover:bg-white/[0.06] hover:text-cream lg:inline-flex"
          >
            {call.label === "Call or Text" ? "Call or Text" : call.label}
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-cream/90 transition hover:border-white/20 hover:bg-white/[0.04] md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            {open ? (
              <span className="text-lg leading-none" aria-hidden>
                ×
              </span>
            ) : (
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="block h-0.5 w-5 bg-cream/90" />
                <span className="block h-0.5 w-5 bg-cream/90" />
                <span className="block h-0.5 w-5 bg-cream/90" />
              </span>
            )}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/[0.06] bg-graphite/95 px-5 pb-4 pt-2 backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-0.5">
            {navItems.map((item) => (
              <Link
                key={`m-${item.href}-${item.label}`}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium tracking-wide text-cream/90 no-underline transition hover:bg-white/[0.04]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {quote.external ? (
              <a
                href={quote.href}
                target="_blank"
                rel={linkrRel}
                className="btn-primary-lg mt-2 text-center text-sm"
                onClick={() => setOpen(false)}
              >
                {quote.label}
              </a>
            ) : (
              <Link
                href={quote.href}
                className="btn-primary-lg mt-2 text-center text-sm"
                onClick={() => setOpen(false)}
              >
                {quote.label}
              </Link>
            )}
            <a
              href={call.href}
              className="btn-secondary mt-2 border-white/15 bg-white/[0.04] text-center text-sm text-cream"
              onClick={() => setOpen(false)}
            >
              Call or Text {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
