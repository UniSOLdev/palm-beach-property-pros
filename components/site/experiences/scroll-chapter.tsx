"use client";

/**
 * One scroll-scrubbed chapter of "The Dive".
 *
 * Server-renders a static poster + caption + quote link (LCP/SEO safe). On capable devices it
 * becomes a tall scroll track with a sticky canvas; scroll progress maps to frame index.
 * Frames load lazily (when the chapter nears the viewport), coarse-to-fine. Reduced motion,
 * Save-Data and slow connections keep the static poster.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  drawCover,
  type ExperienceManifest,
  isCoarsePointer,
  loadFrames,
  nearestLoaded,
  shouldAnimate,
  sizeCanvas,
} from "./frame-loader";

type Props = {
  id: string;
  manifest: ExperienceManifest;
  number: string;
  title: string;
  body: string;
  service: string;
  quoteHref?: string;
  /** scroll length in viewport heights */
  length?: number;
  /** first chapter on the page: its poster is the LCP image, so load it eagerly */
  priority?: boolean;
};

export function ScrollChapter({
  id, manifest, number, title, body, service, quoteHref = "/quote", length = 360, priority = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  const [ready, setReady] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    if (shouldAnimate()) setAnimated(true);
    setTouch(isCoarsePointer());
  }, []);

  useEffect(() => {
    if (!animated) return;
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!section || !canvas || !ctx) return;

    let disposed = false;
    let stopLoad: (() => void) | undefined;
    let cleanupGsap: (() => void) | undefined;
    const count = manifest.frames;
    let portrait = window.innerWidth / window.innerHeight < 1;
    let images: (HTMLImageElement | null)[] = new Array(count).fill(null);
    let current = 0;
    let drawn = -1;
    let shown = false;
    const coarse = isCoarsePointer();

    const draw = () => {
      const idx = nearestLoaded(images, current);
      if (idx < 0 || idx === drawn) return;
      drawCover(ctx, images[idx]!);
      drawn = idx;
      if (!shown) {
        shown = true;
        setReady(true); // once: no React work per frame
      }
    };
    const resize = () => {
      const src = portrait ? manifest.mobile : manifest.desktop;
      sizeCanvas(canvas, src.width, src.height);
      drawn = -1;
      draw();
    };
    const start = () => {
      stopLoad?.();
      images = new Array(count).fill(null);
      stopLoad = loadFrames(manifest, portrait, (i, img) => {
        images[i] = img;
        if (Math.abs(i - current) < 12 || drawn < 0) {
          drawn = -1;
          draw();
        }
      });
    };

    // load only when the chapter approaches the viewport
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: coarse ? "150% 0px" : "100% 0px" },
    );
    io.observe(section);

    const onResize = () => {
      const p = window.innerWidth / window.innerHeight < 1;
      if (p !== portrait) {
        portrait = p;
        start();
      }
      resize();
    };
    window.addEventListener("resize", onResize);
    resize();

    const setOverlay = (p: number) => {
      const cap = captionRef.current;
      const cta = ctaRef.current;
      if (cap) {
        const o = p < 0.08 ? p / 0.08 : p > 0.42 ? Math.max(0, 1 - (p - 0.42) / 0.1) : 1;
        cap.style.opacity = String(o);
        cap.style.transform = `translate3d(0, ${(1 - Math.min(1, p / 0.08)) * 24}px, 0)`;
      }
      if (cta) {
        const o = Math.min(1, Math.max(0, (p - 0.72) / 0.1));
        cta.style.opacity = String(o);
        cta.style.pointerEvents = o > 0.5 ? "auto" : "none";
      }
    };

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      const state = { frame: 0 };
      const tween = gsap.to(state, {
        frame: count - 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          // touch scrolling already has momentum: barely smooth on phones so frames track the finger
          scrub: coarse ? 0.1 : 0.3,
          onUpdate: (self) => setOverlay(self.progress),
        },
        onUpdate: () => {
          const f = Math.round(state.frame);
          if (f !== current) {
            current = f;
            draw();
          }
        },
      });
      cleanupGsap = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();

    return () => {
      disposed = true;
      io.disconnect();
      stopLoad?.();
      window.removeEventListener("resize", onResize);
      cleanupGsap?.();
    };
  }, [animated, manifest]);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={`${id}-title`}
      className="relative bg-navy-deep"
      style={{ height: animated ? `${touch ? Math.round(length * 0.72) : length}svh` : undefined }}
    >
      <div className="sticky top-0 h-[100svh] min-h-[560px] w-full overflow-hidden">
        <picture>
          <source media="(max-aspect-ratio: 1/1)" srcSet={`${manifest.base}/poster-m.webp`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${manifest.base}/poster-d.webp`}
            width={manifest.desktop.width}
            height={manifest.desktop.height}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
            animated && ready ? "opacity-100" : "opacity-0"
          }`}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-deep/75 via-navy-deep/10 to-transparent" />

        <div
          ref={captionRef}
          className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-5xl px-5 pb-28 sm:px-8 md:pb-20"
          style={animated ? { opacity: 0 } : undefined}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cream/85">
            Chapter {number} · {service}
          </p>
          <h2 id={`${id}-title`} className="font-display mt-3 text-4xl font-medium leading-tight text-white sm:text-6xl">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-cream sm:text-lg">{body}</p>
          {!animated ? (
            <Link href={quoteHref} className="btn-gold mt-7 inline-flex">
              Request a private quote
            </Link>
          ) : null}
        </div>

        {animated ? (
          <div ref={ctaRef} style={{ opacity: 0 }} className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-5xl px-5 pb-28 sm:px-8 md:pb-20">
            <p className="font-display text-3xl font-medium text-white sm:text-5xl">{service}, handled privately.</p>
            <Link href={quoteHref} className="btn-gold mt-6 inline-flex">
              Request a private quote
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
