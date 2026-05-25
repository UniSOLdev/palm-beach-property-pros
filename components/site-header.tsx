"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PHONE_TEL } from "@/lib/site";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/service-area", label: "Service Area" },
  { href: "/quote", label: "Quote" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 overflow-x-hidden border-b border-white/[0.06] bg-graphite/75 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl backdrop-saturate-150">
      <nav
        className="mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4 md:gap-4 md:px-6"
        aria-label="Primary"
      >
        <Link
          href="/"
          className="min-w-0 shrink no-underline pr-2"
          aria-label="Palm Beach Property Pros home"
        >
          <Image
            src="/brand/pbpp-wordmark-light.svg"
            alt="Palm Beach Property Pros"
            width={280}
            height={42}
            priority
            className="h-8 w-auto max-w-[10.75rem] sm:h-9 sm:max-w-[13rem] md:h-10 md:max-w-[16rem]"
          />
        </Link>

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
          <a href={PHONE_TEL} className="btn-primary hidden sm:inline-flex">
            Call Now
          </a>
        </div>

        <div className="flex shrink-0 items-center md:hidden">
          <button
            type="button"
            className="inline-flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-white/15 text-cream transition active:scale-95 active:bg-white/10"
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
        <div id="mobile-nav" className="border-t border-white/10 bg-graphite px-4 pb-4 pt-2 sm:px-5 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-cream no-underline hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={PHONE_TEL}
              className="btn-primary mt-2 text-center"
              onClick={() => setOpen(false)}
            >
              Call Now
            </a>
            <Link
              href="/quote"
              className="btn-secondary-lg mt-2 border-white/20 bg-transparent text-center text-cream hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Get Free Quote
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
