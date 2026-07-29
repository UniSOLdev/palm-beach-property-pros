"use client";

import Link from "next/link";
import { MediaAssetImage } from "@/components/media/media-asset-image";
import { MediaFrame } from "@/components/media/media-frame";
import { trackServiceCardClick } from "@/lib/analytics";
import type { HomeServiceCard } from "@/lib/homepage-services";
import type { MediaAsset } from "@/lib/media/types";

type Props = {
  cards: Array<HomeServiceCard & { asset: MediaAsset }>;
};

export function HomeServiceCards({ cards }: Props) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.slug}
          className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:shadow-md ${
            card.secondary
              ? "border-navy/[0.08]"
              : "border-navy/[0.1]"
          }`}
        >
          <MediaFrame aspect="landscape" className="image-frame rounded-none">
            <MediaAssetImage asset={card.asset} width={600} hoverScale />
          </MediaFrame>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-lg font-semibold tracking-tight text-navy">{card.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal/75">{card.description}</p>
            <Link
              href={card.href}
              className="link-luxury mt-4 inline-block text-sm"
              onClick={() => trackServiceCardClick(card.title, "homepage")}
            >
              Learn more →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
