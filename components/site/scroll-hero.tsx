"use client";

/**
 * Cinematic, scroll-driven hero built from photography.
 *
 * Arrival → golden-hour estate (slow push-in) → dissolve to the interior
 * ("the door opens") → soft fade into the page.
 *
 * - Server-renders the first photograph (priority, LCP) and the H1.
 * - GSAP ScrollTrigger (loaded on demand) scrubs transforms/opacity only,
 *   on a CSS-sticky stage, so it stays smooth on iPhone Safari.
 * - Reduced motion, Save-Data, or 2G/3G: a calm static hero, no scroll track.
 *
 * Real drone footage later? See README → "Hero footage" (sequence mode).
 */
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export const HERO_EXTERIOR = {
  src: "/photos/hero-estate-golden-hour.jpg",
  alt: "Mediterranean-style Palm Beach estate and pool terrace at golden hour",
};
const HERO_INTERIOR = {
  src: "/photos/hero-interior-arched.jpg",
  alt: "Light-filled living room with arched windows",
};

function canAnimate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (c?.saveData) return false;
  if (c?.effectiveType && /2g|3g/.test(c.effectiveType)) return false;
  return true;
}

export function ScrollHero() {
  const section = useRef<HTMLElement>(null);
  const exterior = useRef<HTMLDivElement>(null);
  const interior = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const [cinematic, setCinematic] = useState(false);

  useEffect(() => {
    if (canAnimate()) setCinematic(true);
  }, []);

  useEffect(() => {
    if (!cinematic) return;
    let kill: (() => void) | undefined;
    let cancelled = false;
    let started = false;
    // Defer GSAP until the visitor engages (or the page is idle): keeps first load light.
    const events = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"] as const;
    const start = () => {
      if (started) return;
      started = true;
      events.forEach((e) => window.removeEventListener(e, start));
      void init();
    };
    events.forEach((e) => window.addEventListener(e, start, { passive: true, once: true }));
    const idle = window.setTimeout(start, 4000);

    const init = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !section.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom bottom", scrub: 0.8 },
      });
      // Positions are fractions of the scroll track (total duration = 1).
      tl.to(exterior.current, { scale: 1.2, yPercent: -3, duration: 0.5 }, 0)
        .to(cue.current, { autoAlpha: 0, duration: 0.05 }, 0)
        .to(intro.current, { autoAlpha: 0, y: -48, duration: 0.22 }, 0.02)
        .to(shade.current, { opacity: 0.3, duration: 0.25 }, 0.05)
        // "The door opens": a quick, clean dissolve, then a slow settle.
        .fromTo(interior.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14, ease: "power1.inOut" }, 0.4)
        .fromTo(interior.current, { scale: 1.16 }, { scale: 1, duration: 0.6 }, 0.4)
        .to(shade.current, { opacity: 0.75, duration: 0.12 }, 0.5)
        .fromTo(reveal.current, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.58)
        .to(reveal.current, { autoAlpha: 0, y: -20, duration: 0.1 }, 0.84)
        .to(veil.current, { opacity: 1, duration: 0.1 }, 0.9);
      kill = () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    };
    if (window.scrollY > 0) start();
    return () => {
      cancelled = true;
      window.clearTimeout(idle);
      events.forEach((e) => window.removeEventListener(e, start));
      kill?.();
    };
  }, [cinematic]);

  return (
    <section
      ref={section}
      aria-labelledby="hero-title"
      className={`relative -mt-[72px] bg-navy-deep ${cinematic ? "h-[280svh]" : "h-[100svh] min-h-[600px]"}`}
    >
      <div className="sticky top-0 h-[100svh] min-h-[600px] w-full overflow-hidden">
        <div ref={exterior} className="absolute inset-0 will-change-transform">
          <Image
            src={HERO_EXTERIOR.src}
            alt={HERO_EXTERIOR.alt}
            fill
            priority
            quality={72}
            sizes="100vw"
            className="object-cover object-[38%_50%]"
          />
        </div>

        {cinematic ? (
          <div ref={interior} className="invisible absolute inset-0 opacity-0 will-change-transform">
            <Image src={HERO_INTERIOR.src} alt={HERO_INTERIOR.alt} fill quality={70} sizes="100vw" fetchPriority="low" className="object-cover object-[50%_55%]" />
          </div>
        ) : null}

        <div
          ref={shade}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,26,46,0.72)_0%,rgba(8,26,46,0.35)_38%,rgba(8,26,46,0.55)_100%)]"
        />

        <div ref={intro} className="relative z-10 flex h-full items-end pb-[22svh] pt-28 md:items-center md:pb-0">
          <div className="site-container">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-cream/85 sm:text-sm">The Palm Beaches · Private property care</p>
            <h1 id="hero-title" className="font-display mt-5 max-w-4xl text-[2.9rem] font-medium leading-[1.02] text-white sm:text-7xl lg:text-[5.5rem]">
              Palm Beach homes, impeccably kept.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/90 sm:text-xl">
              Estate cleaning, grounds and exterior care, detailing, and private home watch. One discreet team for every detail of your property.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote" className="btn-gold">
                Request a private quote
              </Link>
              <a href={PHONE_TEL} className="btn-ghost-light">
                Call {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>

        {cinematic ? (
          <>
            <div ref={reveal} aria-hidden="true" className="invisible absolute inset-0 z-10 flex items-center justify-center px-6 text-center opacity-0">
              <p className="font-display max-w-3xl text-4xl font-medium leading-tight text-white drop-shadow-[0_2px_24px_rgba(8,26,46,0.6)] sm:text-6xl">
                Inside, everything exactly as it should be.
              </p>
            </div>
            <div ref={cue} aria-hidden="true" className="absolute inset-x-0 bottom-8 z-10 hidden justify-center md:flex">
              <span className="block h-12 w-px bg-gradient-to-b from-cream/0 via-cream/80 to-cream/0" />
            </div>
            <div ref={veil} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-cream opacity-0" />
          </>
        ) : null}
      </div>
    </section>
  );
}
