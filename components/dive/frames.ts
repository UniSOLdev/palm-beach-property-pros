/**
 * The Dive: frame-sequence engine (scroll story + drag-to-spin).
 * Brand-agnostic and dependency-free (GSAP is loaded by the players on demand).
 */

export type FrameSet = { frames: number; base: string; bytes?: { d: number; m: number } };

export type ExperienceManifest = FrameSet & {
  version: string;
  loop?: boolean;
  desktop: { width: number; height: number };
  mobile: { width: number; height: number };
  variants?: Record<string, FrameSet>;
};

export const pad = (n: number) => String(n).padStart(3, "0");

export const frameUrl = (set: FrameSet, i: number, portrait: boolean) =>
  `${set.base}/${portrait ? "m" : "d"}/${pad(i + 1)}.webp`;

/** Static poster only: reduced motion, Save-Data, or 2g/3g connections. */
export function shouldAnimate(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /(^|-)2g|3g/.test(conn.effectiveType)) return false;
  return true;
}

/** Touch-first device (phones, tablets): tighter scrubbing, shorter tracks. */
export function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Canvas backing size: device pixels, but never more than the frame's own resolution
 * (upscaling a 608x1080 frame into a 780x1690 retina canvas costs fill-rate for nothing).
 */
export function sizeCanvas(canvas: HTMLCanvasElement, srcW: number, srcH: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  // scale at which the frame would exactly cover the canvas in CSS pixels
  const cover = Math.max(cw / srcW, ch / srcH);
  const maxScale = cover > 0 ? 1 / cover : dpr;
  const scale = Math.max(1, Math.min(dpr, maxScale));
  canvas.width = Math.round(cw * scale);
  canvas.height = Math.round(ch * scale);
}

/** Coarse-to-fine load order: every 16th frame, then 8th, 4th, 2nd, rest. */
export function loadOrder(count: number): number[] {
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
  return order;
}

/** Loads a frame set lazily with limited concurrency; calls onFrame as each decodes. */
export function loadFrames(
  set: FrameSet,
  portrait: boolean,
  onFrame: (i: number, img: HTMLImageElement) => void,
  concurrency = 4,
): () => void {
  let disposed = false;
  const order = loadOrder(set.frames);
  let cursor = 0;
  const next = () => {
    if (disposed || cursor >= order.length) return;
    const i = order[cursor++];
    const img = new Image();
    img.decoding = "async";
    img.src = frameUrl(set, i, portrait);
    img
      .decode()
      .then(() => {
        if (!disposed) onFrame(i, img);
      })
      .catch(() => {})
      .finally(next);
  };
  for (let k = 0; k < concurrency; k++) next();
  return () => {
    disposed = true;
  };
}

/** object-fit: cover draw of an image into a canvas (optionally blended over what is there). */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, alpha = 1) {
  const { width: cw, height: ch } = ctx.canvas;
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  ctx.globalAlpha = 1;
}

/**
 * Draw a fractional frame position: the nearest loaded frame, then the next frame blended on top
 * by the fractional part. Scrubbing 50 rendered frames reads like ~100: no stepping on slow scrolls.
 * Returns a key describing what was drawn, so callers can skip identical redraws.
 */
export function drawBlend(
  ctx: CanvasRenderingContext2D,
  images: (HTMLImageElement | null)[],
  f: number,
  skipIf = "",
): string {
  const n = images.length;
  const a = Math.max(0, Math.min(n - 1, Math.floor(f)));
  const base = nearestLoaded(images, a);
  if (base < 0) return "";
  const b = a + 1;
  const t = f - a;
  const blend = base === a && b < n && images[b] && t > 0.04 ? Math.round(t * 20) / 20 : 0;
  const key = `${base}:${blend}`;
  if (key === skipIf) return key;
  drawCover(ctx, images[base]!);
  if (blend) drawCover(ctx, images[b]!, blend);
  return key;
}

/**
 * Per-chapter frame store with three tiers, so phones never hold every chapter in memory:
 *   0 = released, 1 = coarse (every 8th frame, enough to scrub roughly), 2 = full.
 * The story's scheduler raises the active chapter and its neighbours, and releases the rest.
 */
export class FrameStore {
  images: (HTMLImageElement | null)[];
  loaded = 0;
  tier: 0 | 1 | 2 = 0;
  portrait = false;
  onFrame: (i: number) => void = () => {};
  private queue: number[] = [];
  private inflight = 0;
  private gen = 0;

  constructor(readonly set: FrameSet) {
    this.images = new Array(set.frames).fill(null);
  }

  setPortrait(portrait: boolean) {
    if (portrait === this.portrait) return;
    this.portrait = portrait;
    const t = this.tier;
    this.release();
    this.want(t);
  }

  want(tier: 0 | 1 | 2) {
    if (tier === this.tier) return;
    if (tier === 0) return this.release();
    const n = this.set.frames;
    const order = tier === 1 ? loadOrder(n).filter((i) => i % 8 === 0 || i === n - 1) : loadOrder(n);
    this.tier = tier;
    this.queue = order.filter((i) => !this.images[i]);
    this.pump();
  }

  release() {
    this.gen++;
    this.tier = 0;
    this.queue = [];
    this.inflight = 0;
    this.images.fill(null);
    this.loaded = 0;
  }

  private pump() {
    const max = this.tier === 2 ? 4 : 2;
    while (this.inflight < max && this.queue.length) {
      const i = this.queue.shift()!;
      if (this.images[i]) continue;
      const gen = this.gen;
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(this.set, i, this.portrait);
      this.inflight++;
      img
        .decode()
        .then(() => {
          if (gen !== this.gen) return;
          this.images[i] = img;
          this.loaded++;
          this.onFrame(i);
        })
        .catch(() => {})
        .finally(() => {
          if (gen !== this.gen) return;
          this.inflight--;
          this.pump();
        });
    }
  }
}

export function nearestLoaded(images: (HTMLImageElement | null)[], i: number, wrap = false) {
  const n = images.length;
  if (images[i]) return i;
  for (let d = 1; d < n; d++) {
    const a = wrap ? (i - d + n) % n : i - d;
    const b = wrap ? (i + d) % n : i + d;
    if (a >= 0 && images[a]) return a;
    if (b < n && images[b]) return b;
  }
  return -1;
}
