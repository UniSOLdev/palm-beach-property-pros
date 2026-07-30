"use client";

import Image from "next/image";
import Link from "next/link";
import { trackServiceCardClick } from "@/lib/analytics";
import { isLocalPublicSrc } from "@/lib/media/resolve";
import type { HomeServiceCard } from "@/lib/homepage-services";
import type { MediaAsset } from "@/lib/media/types";

type Props = {
  cards: Array<HomeServiceCard & { asset: MediaAsset }>;
};

export function HomeServiceCards({ cards }: Props) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <article
          key={card.slug}
          className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:shadow-md ${
            card.secondary ? "border-navy/[0.08]" : "border-navy/[0.1]"
          }`}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-navy/5">
            <Image
              src={card.asset.src}
              alt={card.asset.alt}
              fill
              priority={index < 3}
              className={`object-cover transition duration-500 group-hover:scale-[1.02] ${card.asset.focal ?? "object-center"}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized={isLocalPublicSrc(card.asset.src)}
            />
          </div>
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
