"use client";

import { useState } from "react";

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  label,
}: {
  beforeUrl?: string;
  afterUrl?: string;
  label?: string;
}) {
  const [position, setPosition] = useState(50);

  if (!beforeUrl && !afterUrl) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-sky/30 text-sm text-charcoal/50">
        Add before/after images
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 shadow-card">
      <div className="relative aspect-[16/10] select-none">
        {afterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={afterUrl} alt="After" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="absolute inset-0 bg-ocean/10" />
        )}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          {beforeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={beforeUrl} alt="Before" className="h-full w-full max-w-none object-cover" style={{ width: `${100 / (position / 100)}%` }} draggable={false} />
          ) : (
            <div className="h-full w-full bg-charcoal/10" />
          )}
        </div>
        <div
          className="absolute inset-y-0 w-1 cursor-ew-resize bg-white shadow-lg"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-navy shadow-md">
            ↔
          </div>
        </div>
        <input
          type="range"
          min={5}
          max={95}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          aria-label="Compare before and after"
        />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white">
          Before
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white">
          After
        </div>
      </div>
      {label ? <p className="p-3 text-sm font-medium text-navy">{label}</p> : null}
    </div>
  );
}
