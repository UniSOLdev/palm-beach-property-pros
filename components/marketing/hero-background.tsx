"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MEDIA_UNAVAILABLE_PLACEHOLDER } from "@/lib/media/resolve";

const BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

type HeroBackgroundProps = {
  src: string;
  alt: string;
  /** CSS object-position — defaults favor architecture on the right at desktop widths */
  objectPosition?: string;
};

export function HeroBackground({
  src,
  alt,
  objectPosition = "object-[62%_42%] md:object-[72%_38%]",
}: HeroBackgroundProps) {
  const [offset, setOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const displaySrc = failed || !src?.trim() ? MEDIA_UNAVAILABLE_PLACEHOLDER : src;
  const isLocal = displaySrc.startsWith("/");

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setOffset(Math.min(window.scrollY * 0.18, 72));
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const imageClass = `absolute inset-0 h-full w-full object-cover ${objectPosition} ${failed ? "opacity-40" : ""}`;

  return (
    <div className={`hero-image-layer absolute inset-0 md:rounded-3xl ${loaded ? "is-loaded" : ""}`}>
      {!loaded && <div className="image-skeleton absolute inset-0 z-[1]" aria-hidden />}
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.05)` }}
      >
        {displaySrc.startsWith("/media/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displaySrc}
            alt={failed ? "Media unavailable" : alt}
            className={imageClass}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (!failed) {
                console.warn("[PBPP Media Render]", JSON.stringify({ level: "warn", src, message: "hero load failed" }));
                setFailed(true);
                setLoaded(true);
              }
            }}
          />
        ) : (
          <Image
            src={displaySrc}
            alt={failed ? "Media unavailable" : alt}
            fill
            priority
            unoptimized={isLocal}
            placeholder={failed ? "empty" : "blur"}
            blurDataURL={BLUR}
            className={imageClass}
            sizes="100vw"
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (!failed) {
                console.warn("[PBPP Media Render]", JSON.stringify({ level: "warn", src, message: "hero load failed" }));
                setFailed(true);
                setLoaded(true);
              }
            }}
          />
        )}
      </div>
      {/* Mobile: bottom-weighted overlay for stacked content */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy/90 to-navy/40 md:hidden"
        aria-hidden
      />
      {/* Desktop: left-to-right navy gradient — text left, property visible right */}
      <div
        className="absolute inset-0 hidden bg-gradient-to-r from-navy-deep/96 via-navy/78 to-navy/15 md:block md:rounded-3xl"
        aria-hidden
      />
      <div
        className="absolute inset-0 hidden bg-gradient-to-t from-navy-deep/50 via-transparent to-navy/25 md:block md:rounded-3xl"
        aria-hidden
      />
      <div className="absolute inset-0 bg-luxury-vignette opacity-50 md:rounded-3xl" aria-hidden />
      <div className="hero-grain absolute inset-0 md:rounded-3xl" aria-hidden />
    </div>
  );
}
