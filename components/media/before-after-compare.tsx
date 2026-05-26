"use client";

import { useEffect, useState } from "react";
import { MediaAssetImage } from "@/components/media/media-asset-image";
import { MediaFrame } from "@/components/media/media-frame";
import { ScaffoldNotice } from "@/components/media/scaffold-notice";
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

  useEffect(() => {
    [beforeSrc, afterSrc].forEach((src) => {
      if (!src.startsWith("/")) return;
      const img = new window.Image();
      img.src = src;
    });
  }, [beforeSrc, afterSrc]);

  return (
    <div className="before-after-compare overflow-hidden rounded-2xl border border-navy/[0.08] shadow-card md:rounded-3xl">
      <MediaFrame aspect="wide" className="select-none">
        <div className="absolute inset-0">
          <MediaAssetImage asset={project.after} width={1400} hoverScale={false} />
        </div>
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <div className="absolute inset-0" style={{ width: `${100 / (position / 100)}%` }}>
            <MediaAssetImage asset={project.before} width={1400} hoverScale={false} />
          </div>
        </div>
        <div
          className="before-after-handle absolute inset-y-0 z-[4] w-px bg-white/90 shadow-[0_0_12px_rgba(8,26,46,0.35)]"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-navy-deep/80 text-[10px] font-bold tracking-wider text-cream backdrop-blur-md">
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
        <div className="pointer-events-none absolute left-3 top-3 z-[4] rounded-full bg-navy-deep/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/90 backdrop-blur-md">
          Before
        </div>
        <div className="pointer-events-none absolute right-3 top-3 z-[4] rounded-full bg-navy-deep/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/90 backdrop-blur-md">
          After
        </div>
        {project.isScaffold ? (
          <div className="absolute bottom-3 left-3 z-[4]">
            <ScaffoldNotice compact />
          </div>
        ) : null}
      </MediaFrame>
    </div>
  );
}
