import { MediaAssetImage } from "@/components/media/media-asset-image";
import { MediaFrame } from "@/components/media/media-frame";
import type { MediaAsset } from "@/lib/media/types";

export function PageHeroImage({
  asset,
  className = "",
}: {
  asset: MediaAsset;
  className?: string;
}) {
  return (
    <MediaFrame aspect="wide" className={`image-frame rounded-2xl md:rounded-3xl ${className}`}>
      <MediaAssetImage asset={asset} width={1600} priority />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-navy/10 to-transparent" />
    </MediaFrame>
  );
}
