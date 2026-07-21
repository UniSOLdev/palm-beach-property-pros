"use client";

import Image from "next/image";
import { useState } from "react";

export type BeforeAfterPair = {
  id: string;
  before: { src: string; alt: string; width?: number; height?: number };
  after: { src: string; alt: string; width?: number; height?: number };
  caption?: string;
};

export function BeforeAfterSlider({ pair }: { pair: BeforeAfterPair }) {
  const [position, setPosition] = useState(50);

  return (
    <figure className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-md">
      <div className="relative aspect-[4/3] w-full select-none touch-none">
        <Image
          src={pair.after.src}
          alt={pair.after.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <div className="relative h-full w-[100vw] max-w-none" style={{ width: `${100 / (position / 100)}%` }}>
            <Image
              src={pair.before.src}
              alt={pair.before.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
        <div
          className="absolute inset-y-0 z-10 w-1 bg-cream shadow-[0_0_12px_rgba(0,0,0,0.35)]"
          style={{ left: `${position}%` }}
        />
        <input
          type="range"
          min={5}
          max={95}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label="Compare before and after"
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-navy/70 px-2.5 py-1 text-[11px] font-semibold text-cream">
          Before
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-navy/70 px-2.5 py-1 text-[11px] font-semibold text-cream">
          After
        </div>
      </div>
      {pair.caption ? <figcaption className="px-4 py-3 text-sm text-charcoal/80">{pair.caption}</figcaption> : null}
    </figure>
  );
}

export function BeforeAfterGallery({ pairs }: { pairs: BeforeAfterPair[] }) {
  if (!pairs.length) return null;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {pairs.map((pair) => (
        <BeforeAfterSlider key={pair.id} pair={pair} />
      ))}
    </div>
  );
}
