"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/#private-client", label: "Private client" },
  { href: "/services/auto-detailing", label: "Detailing" },
  { href: "/service-area", label: "Service area" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !overHero || scrolled || open;

  return (
    <header
      className={`sticky top-0 z-40 h-[72px] transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
        solid ? "bg-navy-deep/90 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-cream focus:px-4 focus:py-2 focus:text-navy"
      >
        Skip to content
      </a>
      <nav className="site-container flex h-full items-center justify-between gap-4" aria-label="Primary">
        <Link href="/" className="shrink-0" aria-label="Palm Beach Property Pros home">
          <Image src="/brand/pbpp-wordmark-light.svg" alt="Palm Beach Property Pros" width={280} height={42} priority className="h-8 w-auto max-w-[12rem] sm:h-9 sm:max-w-[15rem]" />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-[15px] font-medium tracking-wide text-cream/90 no-underline transition-colors hover:text-brass-light">
              {item.label}
            </Link>
          ))}
          <a href={PHONE_TEL} className="text-[15px] font-semibold tracking-wide text-cream no-underline hover:text-brass-light">
            {PHONE_DISPLAY}
          </a>
          <Link href="/quote" className="inline-flex min-h-[44px] items-center rounded-full border border-brass/70 px-5 text-[15px] font-semibold text-cream no-underline transition hover:bg-brass hover:text-navy-deep">
            Private quote
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 text-cream lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="relative block h-3 w-5">
            <span className={`absolute left-0 block h-px w-5 bg-cream transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 block h-px w-5 bg-cream transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </nav>

      {open ? (
        <div id="mobile-nav" className="h-[calc(100svh-72px)] overflow-y-auto bg-navy-deep px-5 pb-10 pt-4 lg:hidden">
          <ul>
            {[{ href: "/", label: "Home" }, ...nav, { href: "/quote", label: "Request a quote" }].map((item) => (
              <li key={item.href} className="border-b border-white/10">
                <Link href={item.href} className="font-display block py-5 text-3xl text-cream no-underline" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <a href={PHONE_TEL} className="btn-gold mt-8 w-full">
            Call {PHONE_DISPLAY}
          </a>
        </div>
      ) : null}
    </header>
  );
}
