"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CTA } from "@/lib/cta";
import { PHONE_TEL, QUOTE_PATH } from "@/lib/site";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/service-area", label: "Service Area" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-navy-deep/80 shadow-[0_8px_40px_rgba(8,26,46,0.35)] backdrop-blur-xl backdrop-saturate-150">
      <nav
        className="mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4 md:gap-5 md:px-6"
        aria-label="Primary"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center py-1 no-underline"
          aria-label="Palm Beach Property Pros home"
        >
          <Image
            src="/brand/pbpp-wordmark-light.svg"
            alt="Palm Beach Property Pros"
            width={280}
            height={48}
            priority
            className="h-9 w-auto max-w-[11.5rem] object-contain object-left sm:h-10 sm:max-w-[13.5rem] md:h-11 md:max-w-[15.5rem]"
          />
        </Link>

        <div className="hidden min-w-0 items-center gap-4 text-sm font-medium text-cream/90 md:flex lg:gap-5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-cream/85 no-underline transition-colors duration-300 hover:text-aqua"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={PHONE_TEL}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-cream/90 no-underline transition duration-300 hover:border-white/30 hover:bg-white/[0.06] lg:px-5"
            data-analytics-location="header"
          >
            Call Now
          </a>
          <Link
            href={QUOTE_PATH}
            className="btn-primary whitespace-nowrap px-4 py-2.5 text-sm lg:px-5"
          >
            {CTA.primaryEstimate}
          </Link>
        </div>

        <div className="flex shrink-0 items-center md:hidden">
          <button
            type="button"
            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/15 text-cream transition duration-200 active:scale-95 active:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
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
          className="border-t border-white/10 bg-navy-deep/95 px-4 pb-4 pt-2 transition-[opacity,transform] duration-200 ease-out sm:px-5 md:hidden"
        >
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
            <Link
              href={QUOTE_PATH}
              className="btn-primary mt-2 text-center"
              onClick={() => setOpen(false)}
            >
              {CTA.primaryEstimate}
            </Link>
            <a
              href={PHONE_TEL}
              className="btn-secondary-lg mt-2 border-white/20 bg-transparent text-center text-cream hover:bg-white/10"
              data-analytics-location="mobile-nav"
              onClick={() => setOpen(false)}
            >
              Call Now
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
