"use client";

import { LuxuryImage } from "@/components/marketing/luxury-image";
import { buildMediaUrl, sizesForAspect } from "@/lib/media/resolve";
import type { MediaAsset } from "@/lib/media/types";

type MediaAssetImageProps = {
  asset: MediaAsset;
  width?: number;
  priority?: boolean;
  hoverScale?: boolean;
  className?: string;
};

export function MediaAssetImage({
  asset,
  width = 1200,
  priority = false,
  hoverScale = false,
  className = "",
}: MediaAssetImageProps) {
  const src = buildMediaUrl(asset.src, width);
  const overlay = asset.overlay ?? "none";

  return (
    <LuxuryImage
      src={src}
      alt={asset.alt}
      fill
      priority={priority}
      loading={priority ? undefined : "lazy"}
      overlay={overlay}
      hoverScale={hoverScale}
      blurDataURL={asset.blurDataURL}
      className={`object-cover ${asset.focal ?? "object-center"} ${className}`}
      sizes={sizesForAspect(asset.aspect)}
    />
  );
}
