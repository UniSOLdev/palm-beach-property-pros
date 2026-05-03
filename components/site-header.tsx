"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LINKR_URL, linkrRel } from "@/lib/linkr";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/service-area", label: "Service Area" },
  { href: "/quote", label: "Quote" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/95 shadow-sm backdrop-blur-md">
      <nav
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4"
        aria-label="Primary"
      >
        <BrandLogo variant="header" />

        <div className="hidden items-center gap-6 text-sm font-medium text-navy md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-navy no-underline transition-colors hover:text-ocean"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={LINKR_URL}
            target="_blank"
            rel={linkrRel}
            className="btn-primary hidden sm:inline-flex"
          >
            Call Now
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-navy/15 text-navy md:hidden"
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
                <span className="block h-0.5 w-5 bg-navy" />
                <span className="block h-0.5 w-5 bg-navy" />
                <span className="block h-0.5 w-5 bg-navy" />
              </span>
            )}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-navy/10 bg-cream px-6 pb-4 pt-2 md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-navy no-underline hover:bg-sky/60"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={LINKR_URL}
              target="_blank"
              rel={linkrRel}
              className="btn-primary mt-2 text-center"
              onClick={() => setOpen(false)}
            >
              Call Now
            </a>
            <a
              href={LINKR_URL}
              target="_blank"
              rel={linkrRel}
              className="btn-secondary text-center"
              onClick={() => setOpen(false)}
            >
              Text for Quote
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
