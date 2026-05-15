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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-graphite/90 shadow-lg shadow-black/20 backdrop-blur-xl">
      <nav
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4"
        aria-label="Primary"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BrandLogo variant="header" logoSrc={logoUrl} />
          <span className="hidden min-w-0 text-[10px] font-semibold uppercase leading-tight tracking-[0.18em] text-silver/80 lg:block">
            Premium
            <br />
            operations
          </span>
        </div>

        <div className="hidden items-center gap-6 text-sm font-medium text-cream/90 md:flex">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="text-cream/90 no-underline transition-colors hover:text-aqua"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {quote.external ? (
            <a
              href={quote.href}
              target="_blank"
              rel={linkrRel}
              className="btn-primary-lg hidden px-5 py-2.5 text-sm sm:inline-flex"
            >
              {quote.label}
            </a>
          ) : (
            <Link href={quote.href} className="btn-primary-lg hidden px-5 py-2.5 text-sm sm:inline-flex">
              {quote.label}
            </Link>
          )}
          <a
            href={call.href}
            className="hidden rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-cream/90 no-underline transition hover:border-aqua/40 hover:text-white lg:inline-flex"
          >
            {call.label === "Call or Text" ? `Call or Text ${PHONE_DISPLAY}` : call.label}
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-cream md:hidden"
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
                <span className="block h-0.5 w-5 bg-cream" />
                <span className="block h-0.5 w-5 bg-cream" />
                <span className="block h-0.5 w-5 bg-cream" />
              </span>
            )}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-graphite px-6 pb-4 pt-2 md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={`m-${item.href}-${item.label}`}
                href={item.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-cream no-underline hover:bg-white/5"
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
              <Link href={quote.href} className="btn-primary-lg mt-2 text-center text-sm" onClick={() => setOpen(false)}>
                {quote.label}
              </Link>
            )}
            <a href={call.href} className="btn-secondary mt-2 text-center text-sm" onClick={() => setOpen(false)}>
              {call.label === "Call or Text" ? `Call or Text ${PHONE_DISPLAY}` : call.label}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
