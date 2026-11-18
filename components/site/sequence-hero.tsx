"use client";

/**
 * Scroll-driven cinematic hero.
 *
 * - Server-renders a static poster <picture> + the H1 (good for LCP + SEO).
 * - On capable devices, expands into a tall scroll track with a sticky canvas;
 *   GSAP ScrollTrigger maps scroll progress → frame index of a WebP sequence.
 * - Stays static (poster only, normal height) when the user prefers reduced
 *   motion, has Save-Data on, or is on a slow (2g/3g) connection.
 * - Frames load lazily after first interaction / idle, coarse-to-fine, so the
 *   sequence is scrubbable almost immediately and never blocks first paint.
 *
 * Swap footage: `npm run hero:build -- path/to/clip.mp4` (see README).
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import rawManifest from "@/lib/site/hero-manifest.json";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

type Mode = "static" | "cinematic";

export type HeroManifest = {
  mode: "photo" | "sequence";
  version?: string;
  frames: number;
  base: string;
  desktop: { width: number; height: number };
  mobile: { width: number; height: number };
};
const manifest = rawManifest as unknown as HeroManifest;
export const heroMode = manifest.mode;

const pad = (n: number) => String(n).padStart(3, "0");

function shouldAnimate(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /(^|-)2g|3g/.test(conn.effectiveType)) return false;
  return true;
}

/** Coarse-to-fine load order: every 16th frame, then 8th, 4th, 2nd, rest. */
function loadOrder(count: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(count - 1)) order.push(count - 1);
  return order;
}

/** Frame-sequence hero for real footage (enabled by `npm run hero:build -- clip.mp4`). */
export function SequenceHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("static");
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    if (shouldAnimate()) setMode("cinematic");
  }, []);

  useEffect(() => {
    if (mode !== "cinematic") return;
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let disposed = false;
    let cleanupGsap: (() => void) | undefined;
    const count = manifest.frames;
    const images: (HTMLImageElement | null)[] = new Array(count).fill(null);
    let portrait = window.innerWidth / window.innerHeight < 1;
    let current = 0;
    let drawn = -1;

    const frameUrl = (i: number) =>
      `${manifest.base}/${portrait ? "m" : "d"}/${pad(i + 1)}.webp`;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      drawn = -1;
      draw();
    };

    const nearestLoaded = (i: number) => {
      if (images[i]) return i;
      for (let d = 1; d < count; d++) {
        if (i - d >= 0 && images[i - d]) return i - d;
        if (i + d < count && images[i + d]) return i + d;
      }
      return -1;
    };

    function draw() {
      const idx = nearestLoaded(current);
      if (idx < 0 || idx === drawn) return;
      const img = images[idx]!;
      const cw = canvas!.width;
      const ch = canvas!.height;
      // object-fit: cover
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx!.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      drawn = idx;
      if (!canvasReady) setCanvasReady(true);
    }

    // Overlay copy: intro fades out early, outro ("Welcome home") fades in at the door.
    const setOverlay = (p: number) => {
      const intro = introRef.current;
      const outro = outroRef.current;
      const cue = cueRef.current;
      if (intro) {
        const o = Math.max(0, 1 - p / 0.18);
        intro.style.opacity = String(o);
        intro.style.transform = `translate3d(0, ${-p * 120}px, 0)`;
        intro.style.visibility = o === 0 ? "hidden" : "visible";
      }
      if (shadeRef.current) shadeRef.current.style.opacity = String(Math.max(0, 1 - p / 0.3));
      if (cue) cue.style.opacity = String(Math.max(0, 1 - p / 0.05));
      if (outro) {
        const o = Math.min(1, Math.max(0, (p - 0.9) / 0.08));
        outro.style.opacity = String(o);
        outro.style.visibility = o === 0 ? "hidden" : "visible";
      }
    };

    // ---- lazy, coarse-to-fine preloading ----
    let loadingStarted = false;
    const startLoading = () => {
      if (loadingStarted || disposed) return;
      loadingStarted = true;
      const order = loadOrder(count);
      let cursor = 0;
      const CONCURRENCY = 4;
      const next = () => {
        if (disposed || cursor >= order.length) return;
        const i = order[cursor++];
        const img = new Image();
        img.decoding = "async";
        img.src = frameUrl(i);
        img
          .decode()
          .then(() => {
            if (disposed) return;
            images[i] = img;
            if (Math.abs(i - current) < 20 || drawn < 0) {
              drawn = -1;
              draw();
            }
          })
          .catch(() => {})
          .finally(next);
      };
      for (let k = 0; k < CONCURRENCY; k++) next();
    };

    // First frame immediately (it is the same image as the poster: already cached).
    const first = new Image();
    first.src = frameUrl(0);
    first.decode().then(() => {
      if (disposed) return;
      images[0] = first;
      resize();
    }).catch(() => {});

    const kick = () => startLoading();
    const interactionEvents = ["scroll", "touchstart", "pointerdown", "keydown", "wheel"] as const;
    interactionEvents.forEach((e) => window.addEventListener(e, kick, { once: true, passive: true }));
    const idleTimer = window.setTimeout(kick, 3500);

    const onResize = () => {
      const nowPortrait = window.innerWidth / window.innerHeight < 1;
      if (nowPortrait !== portrait) {
        // orientation changed: switch frame set
        portrait = nowPortrait;
        images.fill(null);
        loadingStarted = false;
        startLoading();
      }
      resize();
    };
    window.addEventListener("resize", onResize);
    resize();

    // ---- GSAP (loaded on demand so it never touches initial JS) ----
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      // iOS Safari: don't recompute on address-bar show/hide.
      ScrollTrigger.config({ ignoreMobileResize: true });
      const state = { frame: 0 };
      const tween = gsap.to(state, {
        frame: count - 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
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
      window.clearTimeout(idleTimer);
      interactionEvents.forEach((e) => window.removeEventListener(e, kick));
      window.removeEventListener("resize", onResize);
      cleanupGsap?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const cinematic = mode === "cinematic";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className={`relative -mt-[72px] bg-navy-deep ${cinematic ? "h-[340svh]" : "h-[88svh] min-h-[560px]"}`}
    >
      <div className="sticky top-0 h-[100svh] min-h-[560px] w-full overflow-hidden">
        <picture>
          <source
            media="(max-aspect-ratio: 1/1)"
            srcSet={`${manifest.base}/poster-m.webp`}
            width={manifest.mobile.width}
            height={manifest.mobile.height}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${manifest.base}/poster-d.webp`}
            width={manifest.desktop.width}
            height={manifest.desktop.height}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
            cinematic && canvasReady ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* legibility gradient */}
        <div
          ref={shadeRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-deep/70 via-navy-deep/30 to-navy-deep/10"
        />

        <div
          ref={introRef}
          className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center px-5 pb-28 pt-10 md:pb-24 md:pt-28 text-center will-change-transform sm:px-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/90 sm:text-sm">
            The Palm Beaches · Private property care
          </p>
          <h1
            id="hero-title"
            className="font-display mt-5 text-[2.6rem] font-medium leading-[1.05] text-white drop-shadow-[0_2px_18px_rgba(8,26,46,0.55)] sm:text-6xl md:text-7xl"
          >
            Palm Beach homes, impeccably kept.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream sm:text-xl">
            Estate cleaning, grounds and exterior care, detailing, and private home watch. One
            discreet team for every detail of your property.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={PHONE_TEL} className="btn-gold w-full sm:w-auto">
              Call {PHONE_DISPLAY}
            </a>
            <Link href="/quote" className="btn-ghost-light w-full sm:w-auto">
              Request a private quote
            </Link>
          </div>
        </div>

        {cinematic ? (
          <>
            <div
              ref={cueRef}
              aria-hidden="true"
              className="absolute inset-x-0 bottom-10 z-10 hidden flex-col items-center gap-2 text-sm text-cream/90 md:flex"
            >
              <span>Scroll</span>
              <span className="block h-10 w-px animate-pulse bg-cream/80" />
            </div>
            <div
              ref={outroRef}
              aria-hidden="true"
              style={{ opacity: 0, visibility: "hidden" }}
              className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
            >
              <p className="font-display text-5xl font-medium text-navy sm:text-7xl">Welcome home.</p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
