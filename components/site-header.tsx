"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/service-area", label: "Service area" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-deep/95 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-cream focus:px-4 focus:py-2 focus:text-navy"
      >
        Skip to content
      </a>
      <nav
        className="site-container flex items-center justify-between gap-3 py-3 md:py-4"
        aria-label="Primary"
      >
        <Link href="/" className="shrink-0" aria-label="Palm Beach Property Pros — home">
          <Image
            src="/brand/pbpp-wordmark-light.svg"
            alt="Palm Beach Property Pros"
            width={280}
            height={42}
            priority
            className="h-8 w-auto max-w-[11rem] sm:h-9 sm:max-w-[14rem]"
          />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-base font-medium text-cream/90 no-underline transition-colors hover:text-brass-light"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={PHONE_TEL}
            className="text-base font-semibold text-cream no-underline hover:text-brass-light"
          >
            {PHONE_DISPLAY}
          </a>
          <Link
            href="/quote"
            className="inline-flex min-h-[44px] items-center rounded-full bg-brass px-5 text-base font-semibold text-navy-deep no-underline transition hover:bg-brass-light"
          >
            Request a quote
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 text-cream md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? (
            <span className="text-3xl leading-none" aria-hidden>
              ×
            </span>
          ) : (
            <span className="flex flex-col gap-1.5" aria-hidden>
              <span className="block h-0.5 w-6 bg-cream" />
              <span className="block h-0.5 w-6 bg-cream" />
              <span className="block h-0.5 w-6 bg-cream" />
            </span>
          )}
        </button>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-white/10 bg-navy-deep px-5 pb-6 pt-2 md:hidden">
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-2 py-4 text-xl font-medium text-cream no-underline hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/quote" className="btn-gold mt-4 w-full" onClick={() => setOpen(false)}>
            Request a private quote
          </Link>
        </div>
      ) : null}
    </header>
  );
}
