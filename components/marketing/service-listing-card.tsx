import Image from "next/image";
import Link from "next/link";
import { CTA } from "@/lib/cta";
import { getServiceStockAsset } from "@/lib/media/site-imagery";
import { getServicePublicHref } from "@/lib/service-pages";
import type { ServiceDefinition } from "@/lib/services";
import { QUOTE_PATH } from "@/lib/site";

export function ServiceListingCard({ service }: { service: ServiceDefinition }) {
  const image = getServiceStockAsset(service.slug);

  return (
    <article
      id={service.anchor}
      className="scroll-mt-28 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-md transition duration-200 hover:shadow-lg"
    >
      {image ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className={`object-cover ${image.focal ?? "object-center"}`}
            sizes="(max-width: 640px) 100vw, 50vw"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="p-6">
        <h2 className="text-xl font-bold text-navy">{service.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{service.shortDescription}</p>
        <p className="mt-3 text-sm font-medium text-ocean">Best for</p>
        <p className="text-sm text-charcoal/85">{service.bestFor}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={getServicePublicHref(service.slug)}
            className="btn-primary px-4 py-2 text-xs sm:text-sm"
          >
            Learn more
          </Link>
          <Link
            href={`${QUOTE_PATH}?service=${encodeURIComponent(service.name)}`}
            className="btn-secondary px-4 py-2 text-xs sm:text-sm"
          >
            {CTA.requestEstimate}
          </Link>
        </div>
      </div>
    </article>
  );
}
