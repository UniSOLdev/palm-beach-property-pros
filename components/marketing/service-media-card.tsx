import Link from "next/link";
import { MediaAssetImage } from "@/components/media/media-asset-image";
import { MediaFrame } from "@/components/media/media-frame";
import type { MediaAsset } from "@/lib/media/types";

type Props = {
  href: string;
  title: string;
  description: string;
  asset: MediaAsset;
  footer?: React.ReactNode;
  className?: string;
};

export function ServiceMediaCard({
  href,
  title,
  description,
  asset,
  footer,
  className = "",
}: Props) {
  return (
    <Link
      href={href}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-luxury no-underline ${className}`}
    >
      <MediaFrame aspect="landscape" className="rounded-none">
        <MediaAssetImage asset={asset} width={800} hoverScale />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
      </MediaFrame>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold tracking-tight text-navy group-hover:text-ocean">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-snug text-charcoal/70">{description}</p>
        {footer ?? (
          <span className="mt-4 text-xs font-semibold text-ocean">Details →</span>
        )}
      </div>
    </Link>
  );
}
