"use client";

import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { CTA } from "@/lib/cta";
import { getSiteImage } from "@/lib/media/site-imagery";
import { QUOTE_PATH } from "@/lib/site";

const PATHS = [
  {
    id: "residential",
    imageId: "path-residential",
    eyebrow: "Homeowners & seasonal residents",
    title: "Residential",
    body: "Recurring home cleaning, window service, pressure washing, move-in prep, and estate care for Palm Beach County homes.",
    bullets: ["Single-family homes & condos", "Seasonal open/close cleaning", "Deep cleans & maintenance"],
    href: `${QUOTE_PATH}?audience=residential`,
    cta: CTA.primaryEstimate,
    event: "residential_inquiry" as const,
  },
  {
    id: "commercial",
    imageId: "path-commercial",
    eyebrow: "Managers & operators",
    title: "Commercial & property management",
    body: "Storefront cleaning, office care, rental turnovers, and coordinated property support for managers and operators.",
    bullets: ["Retail & office spaces", "Airbnb & vacation rentals", "Recurring commercial programs"],
    href: `${QUOTE_PATH}?audience=commercial`,
    cta: CTA.requestEstimate,
    event: "commercial_inquiry" as const,
  },
] as const;

export function CustomerPaths() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {PATHS.map((path) => {
        const image = getSiteImage(path.imageId);
        return (
          <article
            key={path.id}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-sm"
          >
            {image ? (
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={image.filePath}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                  unoptimized
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-6 md:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua-muted">
                {path.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-navy">{path.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/75">{path.body}</p>
              <ul className="mt-4 space-y-2 text-sm text-charcoal/70">
                {path.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aqua" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={path.href}
                className="btn-primary mt-6 w-full text-center sm:w-auto"
                onClick={() => trackEvent(path.event, { location: "homepage" })}
              >
                {path.cta}
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
