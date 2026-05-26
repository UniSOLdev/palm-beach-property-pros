"use client";

import { useState } from "react";
import { buildMediaUrl } from "@/lib/media/resolve";
import type { TransformationProject } from "@/lib/media/types";

export function BeforeAfterCompare({
  project,
}: {
  project: Pick<TransformationProject, "before" | "after" | "isScaffold" | "title">;
}) {
  const [position, setPosition] = useState(50);
  const beforeSrc = buildMediaUrl(project.before.src, 1400);
  const afterSrc = buildMediaUrl(project.after.src, 1400);
  const clipWidth = Math.max(position, 8);

  return (
    <div className="before-after-compare overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-luxury md:rounded-3xl">
      <div className="relative aspect-[4/3] w-full md:aspect-[16/10]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterSrc}
          alt={`After — ${project.title}`}
          className="absolute inset-0 z-[1] h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div
          className="absolute inset-y-0 left-0 z-[2] overflow-hidden"
          style={{ width: `${clipWidth}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeSrc}
            alt={`Before — ${project.title}`}
            className="absolute inset-0 z-[1] h-full max-w-none object-cover"
            style={{ width: `${100 / (clipWidth / 100)}%` }}
            loading="eager"
            decoding="async"
          />
        </div>
        <div
          className="before-after-handle absolute inset-y-0 z-[4] w-0.5 bg-white/95 shadow-[0_0_16px_rgba(8,26,46,0.4)]"
          style={{ left: `${clipWidth}%`, transform: "translateX(-50%)" }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-navy-deep/85 text-[11px] font-bold tracking-wider text-cream shadow-lg backdrop-blur-md">
            ↔
          </div>
        </div>
        <input
          type="range"
          min={8}
          max={92}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          className="absolute inset-0 z-[5] h-full w-full cursor-ew-resize opacity-0"
          aria-label={`Compare before and after for ${project.title}`}
        />
        <div className="pointer-events-none absolute left-3 top-3 z-[4] rounded-full bg-navy-deep/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream backdrop-blur-md">
          Before
        </div>
        <div className="pointer-events-none absolute right-3 top-3 z-[4] rounded-full bg-navy-deep/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream backdrop-blur-md">
          After
        </div>
      </div>
      <p className="border-t border-navy/[0.06] px-4 py-3 text-center text-xs text-charcoal/55 md:px-6">
        Drag the handle to compare conditions
      </p>
    </div>
  );
}
