"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/service-area", label: "Service Area" },
  { href: "/quote", label: "Quote" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-graphite/90 shadow-lg shadow-black/20 backdrop-blur-xl">
      <nav
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4"
        aria-label="Primary"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BrandLogo variant="header" />
          <span className="hidden min-w-0 text-[10px] font-semibold uppercase leading-tight tracking-[0.18em] text-silver/80 lg:block">
            Premium
            <br />
            operations
          </span>
        </div>

        <div className="hidden items-center gap-6 text-sm font-medium text-cream/90 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-cream/90 no-underline transition-colors hover:text-aqua"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a
            href={LINKR_URL}
            target="_blank"
            rel={linkrRel}
            className="btn-primary-lg hidden px-5 py-2.5 text-sm sm:inline-flex"
          >
            Get Free Quote
          </a>
          <a
            href={PHONE_TEL}
            className="hidden rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-cream/90 no-underline transition hover:border-aqua/40 hover:text-white lg:inline-flex"
          >
            Call or Text
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
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-cream no-underline hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={LINKR_URL}
              target="_blank"
              rel={linkrRel}
              className="btn-primary-lg mt-2 text-center text-sm"
              onClick={() => setOpen(false)}
            >
              Get Free Quote
            </a>
            <a
              href={PHONE_TEL}
              className="btn-secondary mt-2 text-center text-sm"
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
