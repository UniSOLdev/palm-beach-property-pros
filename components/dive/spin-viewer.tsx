"use client";

/**
 * Drag-to-spin vehicle viewer (Auto Detailing).
 *
 * Static poster first (SSR, reduced-motion / slow-connection fallback). When the viewer
 * scrolls near the viewport the current variant's frames load coarse-to-fine; dragging
 * (mouse, touch, pen) or the arrow keys rotate the car. A toggle switches Foam / Finish.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  drawCover,
  type ExperienceManifest,
  type FrameSet,
  loadFrames,
  nearestLoaded,
  shouldAnimate,
  sizeCanvas,
} from "./frames";

type Props = {
  manifest: ExperienceManifest;
  labels?: Record<string, string>;
  initial?: string;
};

export function SpinViewer({ manifest, labels = {}, initial }: Props) {
  const variants = Object.keys(manifest.variants ?? {});
  const [variant, setVariant] = useState(initial && variants.includes(initial) ? initial : variants[0]);
  const [animated, setAnimated] = useState(false);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [hinted, setHinted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const drawnRef = useRef(-1);
  const readyRef = useRef(false);
  const set: FrameSet = manifest.variants![variant];

  useEffect(() => {
    if (shouldAnimate()) setAnimated(true);
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setNear(true), { rootMargin: "50% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!ctx) return;
    const idx = nearestLoaded(imagesRef.current, frameRef.current, true);
    if (idx < 0 || idx === drawnRef.current) return;
    drawCover(ctx, imagesRef.current[idx]!);
    drawnRef.current = idx;
    if (!readyRef.current) {
      readyRef.current = true;
      setReady(true);
    }
  }, []);

  // (re)load frames for the active variant
  useEffect(() => {
    if (!animated || !near) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Always the full 16:9 frames: a 9:16 crop would cut the nose and tail off side views.
    const portrait = false;
    const resize = () => {
      sizeCanvas(canvas, manifest.desktop.width, manifest.desktop.height);
      drawnRef.current = -1;
      draw();
    };
    // keep the previous variant's frames on screen until the new ones arrive
    const next: (HTMLImageElement | null)[] = new Array(set.frames).fill(null);
    let swapped = false;
    const stop = loadFrames(set, portrait, (i, img) => {
      next[i] = img;
      if (!swapped) {
        swapped = true;
        imagesRef.current = next;
      }
      if (i === frameRef.current || drawnRef.current < 0 || nearestLoaded(next, frameRef.current, true) === i) {
        drawnRef.current = -1;
        draw();
      }
    }, 6);
    window.addEventListener("resize", resize);
    resize();
    return () => {
      stop();
      window.removeEventListener("resize", resize);
    };
  }, [animated, near, set, draw, manifest.desktop.width, manifest.desktop.height]);

  // drag / keyboard rotation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!animated || !canvas) return;
    let dragging = false;
    let lastX = 0;
    let acc = 0;
    const pxPerFrame = () => Math.max(6, canvas.clientWidth / (set.frames * 1.1));
    const step = (d: number) => {
      const n = set.frames;
      frameRef.current = (((frameRef.current + d) % n) + n) % n;
      draw();
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      acc = 0;
      canvas.setPointerCapture(e.pointerId);
      setHinted(true);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      acc += e.clientX - lastX;
      lastX = e.clientX;
      const ppf = pxPerFrame();
      while (Math.abs(acc) >= ppf) {
        step(acc > 0 ? -1 : 1);
        acc -= Math.sign(acc) * ppf;
      }
    };
    const up = () => {
      dragging = false;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(1);
      else if (e.key === "ArrowRight") step(-1);
      else return;
      e.preventDefault();
      setHinted(true);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("keydown", key);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("keydown", key);
    };
  }, [animated, set, draw]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#0b0d11] sm:aspect-[16/9]">
        <picture>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${set.base}/poster-d.webp`}
            alt={`Unbranded luxury car, ${labels[variant] ?? variant}`}
            width={manifest.desktop.width}
            height={manifest.desktop.height}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <canvas
          ref={canvasRef}
          tabIndex={animated ? 0 : -1}
          role="img"
          aria-label="Drag or use the arrow keys to turn the car"
          className={`absolute inset-0 h-full w-full cursor-grab touch-pan-y outline-none transition-opacity duration-300 active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[color:var(--dive-accent,#C2A06A)] ${
            animated && ready ? "opacity-100" : "opacity-0"
          }`}
        />
        {animated && !hinted ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
            <span className="rounded-full bg-black/45 px-4 py-2 text-sm text-white backdrop-blur">Drag to turn</span>
          </div>
        ) : null}
      </div>
      {variants.length > 1 ? (
        <div role="tablist" aria-label="Finish" className="mt-5 flex justify-center gap-2">
          {variants.map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={v === variant}
              onClick={() => setVariant(v)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                v === variant ? "bg-[var(--dive-bg,#081A2E)] text-white" : "bg-white text-[color:var(--dive-bg,#081A2E)] ring-1 ring-black/15 hover:ring-black/40"
              }`}
            >
              {labels[v] ?? v}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
