/** Shared helpers for WebP frame-sequence players (scroll story + drag-to-spin). */

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

/** object-fit: cover draw of an image into a canvas. */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const { width: cw, height: ch } = ctx.canvas;
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
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
