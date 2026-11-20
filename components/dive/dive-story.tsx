"use client";

/**
 * The Dive: a scroll-driven, chapter-by-chapter story told with rendered frame sequences.
 *
 * - Server-renders every chapter's poster, headline and copy (SEO, no-JS and reduced-motion safe).
 * - On capable devices each chapter becomes a tall scroll track with a sticky canvas. Scroll
 *   position scrubs the frames; neighbouring frames are blended, so motion stays smooth.
 * - Memory-aware loading: the active chapter is held in full, its neighbours coarse, the rest
 *   released. Nothing loads until the visitor engages (or the page is idle), so first paint stays light.
 * - Captions are "beats" over each chapter's progress; chapters dip to the background colour
 *   between them; a chapter rail (desktop) / progress bar (phones) lets visitors jump or skip.
 * - Reduced motion, Save-Data and slow connections get a calm editorial layout of posters.
 *
 * Brand-agnostic: colours come from CSS variables (--dive-bg, --dive-ink, --dive-accent) and
 * button/typeface classes from `theme`. See docs/THE_DIVE_THEME.md.
 */
import Link from "next/link";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { drawBlend, FrameStore, isCoarsePointer, shouldAnimate, sizeCanvas } from "./frames";
import type { DiveChapter, DiveHero, DiveTheme } from "./types";

type Props = {
  chapters: DiveChapter[];
  /** page hero shown over the first chapter (holds the H1) */
  hero?: DiveHero;
  theme?: DiveTheme;
  /** where "Skip the story" goes, e.g. "#services" */
  skipHref: string;
  skipLabel?: string;
  /** extra classes for the wrapper (e.g. a negative top margin under a transparent header) */
  className?: string;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 0..1 opacity of a beat at progress p, with soft edges. A beat starting at 0 or ending at 1 holds there. */
function ramp(p: number, from: number, to: number, edge = 0.05) {
  if (p < from || p > to) return 0;
  const a = from <= 0 ? 1 : Math.min(1, (p - from) / edge);
  const b = to >= 1 ? 1 : Math.min(1, (to - p) / edge);
  return Math.min(a, b);
}

export function DiveStory({ chapters, hero, theme, skipHref, skipLabel = "Skip the story", className = "" }: Props) {
  const [animated, setAnimated] = useState(false);
  const [touch, setTouch] = useState(false);
  const [active, setActive] = useState(0);
  const [railOn, setRailOn] = useState(false);
  const stores = useMemo(() => chapters.map((c) => new FrameStore(c.manifest)), [chapters]);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const mfills = useRef<(HTMLSpanElement | null)[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engaged = useRef(false);
  const activeRef = useRef(0);
  const nextFull = useRef(false);
  const inView = useRef(false);
  const pastHero = useRef(!hero);
  const railRef = useRef(false);

  useEffect(() => {
    if (shouldAnimate()) setAnimated(true);
    setTouch(isCoarsePointer());
  }, []);

  /** Decide which chapters hold frames: active = full, next = coarse then full, previous = coarse. */
  const plan = useCallback(() => {
    if (!engaged.current) return;
    const a = activeRef.current;
    stores.forEach((s, i) => {
      const d = i - a;
      s.want(d === 0 ? 2 : d === 1 ? (nextFull.current ? 2 : 1) : d === -1 ? 1 : 0);
    });
  }, [stores]);

  const syncRail = useCallback(() => {
    const on = inView.current && pastHero.current;
    if (on !== railRef.current) {
      railRef.current = on;
      setRailOn(on);
    }
  }, []);

  // engagement gate + orientation + rail visibility
  useEffect(() => {
    if (!animated) return;
    const portrait = () => window.innerWidth / window.innerHeight < 1;
    stores.forEach((s) => s.setPortrait(portrait()));
    const events = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"] as const;
    const engage = () => {
      if (engaged.current) return;
      engaged.current = true;
      events.forEach((e) => window.removeEventListener(e, engage));
      plan();
    };
    events.forEach((e) => window.addEventListener(e, engage, { passive: true }));
    const idle = window.setTimeout(engage, 2500);
    if (window.scrollY > 0) engage();
    const onResize = () => stores.forEach((s) => s.setPortrait(portrait()));
    window.addEventListener("resize", onResize);
    const io = new IntersectionObserver(([e]) => {
      inView.current = e.isIntersecting;
      syncRail();
    });
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => {
      window.clearTimeout(idle);
      events.forEach((e) => window.removeEventListener(e, engage));
      window.removeEventListener("resize", onResize);
      io.disconnect();
      stores.forEach((s) => s.release());
    };
  }, [animated, stores, plan, syncRail]);

  const onActive = useCallback(
    (i: number) => {
      if (i === activeRef.current) return;
      activeRef.current = i;
      nextFull.current = false;
      setActive(i);
      plan();
    },
    [plan],
  );

  const onProgress = useCallback(
    (i: number, p: number) => {
      const f = fills.current[i];
      const m = mfills.current[i];
      if (f) f.style.transform = `scaleY(${p})`;
      if (m) m.style.transform = `scaleX(${p})`;
      if (i === activeRef.current && !nextFull.current && p > 0.35) {
        nextFull.current = true;
        plan();
      }
      if (i === 0 && hero) {
        const past = p > 0.1;
        if (past !== pastHero.current) {
          pastHero.current = past;
          syncRail();
        }
      }
    },
    [plan, hero, syncRail],
  );

  const go = (i: number) => {
    const el = document.getElementById(chapters[i].id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY + (i === 0 && hero ? window.innerHeight * 0.4 : 2);
    window.scrollTo({ top, behavior: "smooth" });
  };

  const vars = {
    "--dive-bg": theme?.bg ?? "#081A2E",
    "--dive-ink": theme?.ink ?? "#ffffff",
    "--dive-accent": theme?.accent ?? "#C2A06A",
  } as CSSProperties;

  return (
    <div ref={wrapRef} id="story" className={`relative bg-[var(--dive-bg)] ${className}`} style={vars}>
      <a
        href={skipHref}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-black"
      >
        {skipLabel}
      </a>

      {chapters.map((c, i) => (
        <Stage
          key={c.id}
          chapter={c}
          index={i}
          total={chapters.length}
          hero={i === 0 ? hero : undefined}
          theme={theme}
          animated={animated}
          touch={touch}
          store={stores[i]}
          onActive={onActive}
          onProgress={onProgress}
        />
      ))}

      {animated ? (
        <>
          {/* desktop chapter rail */}
          <nav
            aria-label="Story chapters"
            className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-500 md:block"
            style={{ opacity: railOn ? 1 : 0, pointerEvents: railOn ? "auto" : "none" }}
          >
            <ol className="flex flex-col items-end gap-3">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === active ? "step" : undefined}
                    aria-label={`Chapter ${i + 1}: ${c.label}`}
                    className="group flex items-center gap-3 rounded-full py-1 pl-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--dive-accent)]"
                  >
                    <span
                      className={`text-[11px] font-medium uppercase tracking-[0.2em] drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)] transition-opacity duration-300 ${
                        i === active ? "opacity-90" : "opacity-0 group-hover:opacity-80 group-focus-visible:opacity-80"
                      }`}
                    >
                      {c.label}
                    </span>
                    <span className="relative block h-9 w-[2px] overflow-hidden rounded-full bg-white/25">
                      <span
                        ref={(el) => {
                          fills.current[i] = el;
                        }}
                        className="absolute inset-0 origin-top bg-[var(--dive-accent)]"
                        style={{ transform: "scaleY(0)" }}
                      />
                    </span>
                    <span className={`w-5 text-right text-[11px] tabular-nums ${i === active ? "opacity-100" : "opacity-60"}`}>{pad2(i + 1)}</span>
                  </button>
                </li>
              ))}
              <li>
                <a
                  href={skipHref}
                  className="mt-2 block rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70 outline-none drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)] hover:text-white focus-visible:ring-2 focus-visible:ring-[color:var(--dive-accent)]"
                >
                  Skip ↓
                </a>
              </li>
            </ol>
          </nav>

          {/* phone progress: one segment per chapter */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex gap-1 px-1.5 pt-1 transition-opacity duration-500 md:hidden"
            style={{ opacity: railOn ? 1 : 0 }}
          >
            {chapters.map((c, i) => (
              <span key={c.id} className="relative block h-[2px] flex-1 overflow-hidden rounded-full bg-white/30">
                <span
                  ref={(el) => {
                    mfills.current[i] = el;
                  }}
                  className="absolute inset-0 origin-left bg-[var(--dive-accent)]"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

type StageProps = {
  chapter: DiveChapter;
  index: number;
  total: number;
  hero?: DiveHero;
  theme?: DiveTheme;
  animated: boolean;
  touch: boolean;
  store: FrameStore;
  onActive: (i: number) => void;
  onProgress: (i: number, p: number) => void;
};

function Stage({ chapter: c, index, total, hero, theme, animated, touch, store, onActive, onProgress }: StageProps) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const display = theme?.displayClass ?? "dive-display";
  const cta = theme?.ctaClass ?? "dive-btn";
  const length = c.length ?? 360;

  // [from, to] windows, in render order: hero?, main caption, extra beats..., call to action
  const windows = useMemo(() => {
    const w: [number, number][] = [];
    if (hero) w.push([0, 0.1]);
    w.push([hero ? 0.14 : 0.04, 0.44]);
    for (const b of c.beats ?? []) w.push([b.from, b.to]);
    w.push([0.74, 1]);
    return w;
  }, [hero, c.beats]);

  useEffect(() => {
    if (!animated) return;
    const sec = section.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d", { alpha: false });
    if (!sec || !cv || !ctx) return;

    let disposed = false;
    let kill: (() => void) | undefined;
    const n = c.manifest.frames;
    const st = { frame: 0 };
    let key = "";
    let shown = false;

    const draw = () => {
      const k = drawBlend(ctx, store.images, st.frame, key);
      if (!k) return;
      key = k;
      if (!shown) {
        shown = true;
        setReady(true);
      }
    };
    const showBar = () => {
      const el = bar.current;
      if (!el) return;
      const target = store.tier === 1 ? Math.ceil(n / 8) : n;
      const f = Math.min(1, store.loaded / target);
      el.style.transform = `scaleX(${f})`;
      el.style.opacity = store.tier === 0 || store.loaded >= n ? "0" : "1";
    };
    store.onFrame = (i) => {
      if (!shown || Math.abs(i - st.frame) < 10) {
        key = "";
        draw();
      }
      showBar();
    };
    const resize = () => {
      const src = window.innerWidth / window.innerHeight < 1 ? c.manifest.mobile : c.manifest.desktop;
      sizeCanvas(cv, src.width, src.height);
      key = "";
      draw();
    };
    window.addEventListener("resize", resize);
    resize();

    const overlay = (p: number) => {
      windows.forEach(([from, to], k) => {
        const el = layers.current[k];
        if (!el) return;
        const o = ramp(p, from, to);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(1 - o) * (p < from + 0.05 ? 18 : -12)}px, 0)`;
        el.style.visibility = o > 0.001 ? "visible" : "hidden";
      });
      const v = veil.current;
      if (v) {
        const enter = index === 0 ? 0 : p < 0.05 ? 1 - p / 0.05 : 0;
        const exit = p > 0.94 ? (p - 0.94) / 0.06 : 0;
        v.style.opacity = String(Math.max(enter, exit));
      }
    };
    overlay(0);

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      const tween = gsap.to(st, {
        frame: n - 1,
        ease: "none",
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: "bottom bottom",
          // touch scrolling already has momentum: barely smooth on phones so frames track the finger
          scrub: touch ? 0.1 : 0.3,
          onUpdate: (self) => {
            overlay(self.progress);
            onProgress(index, self.progress);
          },
          onToggle: (self) => {
            if (self.isActive) onActive(index);
          },
        },
        onUpdate: draw,
      });
      kill = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();

    return () => {
      disposed = true;
      store.onFrame = () => {};
      window.removeEventListener("resize", resize);
      kill?.();
    };
  }, [animated, touch, c.manifest, store, index, windows, onActive, onProgress]);

  const setLayer = (k: number) => (el: HTMLDivElement | null) => {
    layers.current[k] = el;
  };
  let k = 0;
  const hidden: CSSProperties | undefined = animated ? { opacity: 0, visibility: "hidden" } : undefined;
  const shade = "linear-gradient(to top, color-mix(in srgb, var(--dive-bg) 80%, transparent) 0%, color-mix(in srgb, var(--dive-bg) 15%, transparent) 50%, transparent 75%)";

  return (
    <section
      ref={section}
      id={c.id}
      aria-labelledby={`${c.id}-title`}
      className="relative bg-[var(--dive-bg)]"
      style={{ height: animated ? `${touch ? Math.round(length * 0.72) : length}svh` : undefined }}
    >
      <div className="sticky top-0 h-[100svh] min-h-[560px] w-full overflow-hidden text-[color:var(--dive-ink)]">
        <picture>
          <source media="(max-aspect-ratio: 1/1)" srcSet={`${c.manifest.base}/poster-m.webp`} width={c.manifest.mobile.width} height={c.manifest.mobile.height} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${c.manifest.base}/poster-d.webp`}
            width={c.manifest.desktop.width}
            height={c.manifest.desktop.height}
            alt={c.posterAlt}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <canvas
          ref={canvas}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${animated && ready ? "opacity-100" : "opacity-0"}`}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: shade }} />

        {hero ? (
          <div ref={setLayer(k++)} className="absolute inset-0 z-10 will-change-transform">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--dive-bg) 70%, transparent) 0%, color-mix(in srgb, var(--dive-bg) 30%, transparent) 40%, color-mix(in srgb, var(--dive-bg) 55%, transparent) 100%)" }}
            />
            <div className="relative flex h-full items-end pb-[22svh] pt-28 md:items-center md:pb-0">
              <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
                <p className="text-xs font-medium uppercase tracking-[0.32em] opacity-85 sm:text-sm">{hero.kicker}</p>
                <h1 className={`${display} mt-5 max-w-4xl text-[2.9rem] font-medium leading-[1.02] sm:text-7xl lg:text-[5.5rem]`}>{hero.title}</h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-90 sm:text-xl">{hero.lead}</p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">{hero.actions}</div>
                {animated ? (
                  <p aria-hidden="true" className="mt-10 hidden items-center gap-3 text-xs uppercase tracking-[0.3em] opacity-70 md:flex">
                    <span className="block h-px w-10 bg-current" /> Scroll to begin
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* main caption (in the static layout it carries the call to action) */}
        <div
          ref={setLayer(k++)}
          style={hidden}
          className={`absolute inset-x-0 bottom-0 z-10 mx-auto max-w-5xl px-5 pb-28 will-change-transform sm:px-8 md:pb-20 ${
            hero && !animated ? "sr-only" : ""
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-85">
            <span className="tabular-nums">{pad2(index + 1)} / {pad2(total)}</span>
            <span className="mx-2 opacity-60">·</span>
            {c.service}
          </p>
          <h2 id={`${c.id}-title`} className={`${display} mt-3 text-4xl font-medium leading-tight sm:text-6xl`}>
            {c.title}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed opacity-90 sm:text-lg">{c.body}</p>
          {!animated ? (
            <Link href={c.cta.href} className={`${cta} mt-7 inline-flex`}>
              {c.cta.label}
            </Link>
          ) : null}
        </div>

        {animated
          ? (c.beats ?? []).map((b, bi) => (
              <div
                key={bi}
                ref={setLayer(k++)}
                style={hidden}
                className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center will-change-transform"
              >
                <div className="max-w-3xl">
                  {b.kicker ? <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-80">{b.kicker}</p> : null}
                  {b.title ? (
                    <p className={`${display} mt-3 text-4xl font-medium leading-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-6xl`}>{b.title}</p>
                  ) : null}
                  {b.body ? <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed opacity-90 sm:text-lg">{b.body}</p> : null}
                </div>
              </div>
            ))
          : null}

        {animated ? (
          <div ref={setLayer(k++)} style={hidden} className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-5xl px-5 pb-28 will-change-transform sm:px-8 md:pb-20">
            <p className={`${display} text-3xl font-medium sm:text-5xl`}>{c.cta.line ?? `${c.service}, handled privately.`}</p>
            <Link href={c.cta.href} className={`${cta} mt-6 inline-flex`}>
              {c.cta.label}
            </Link>
          </div>
        ) : null}

        {animated ? (
          <>
            <div ref={veil} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-[var(--dive-bg)]" style={{ opacity: index === 0 ? 0 : 1 }} />
            <div
              ref={bar}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[2px] origin-left bg-[var(--dive-accent)] opacity-0 transition-opacity duration-500"
              style={{ transform: "scaleX(0)" }}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
