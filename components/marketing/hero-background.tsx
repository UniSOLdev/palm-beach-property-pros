"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MEDIA_UNAVAILABLE_PLACEHOLDER } from "@/lib/media/resolve";

const BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

export function HeroBackground({ src, alt }: { src: string; alt: string }) {
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

  return (
    <div className={`hero-image-layer absolute inset-0 md:rounded-3xl ${loaded ? "is-loaded" : ""}`}>
      {!loaded && <div className="image-skeleton absolute inset-0 z-[1]" aria-hidden />}
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.06)` }}
      >
        {displaySrc.startsWith("/media/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displaySrc}
            alt={failed ? "Media unavailable" : alt}
            className={`absolute inset-0 h-full w-full object-cover object-[center_42%] ${failed ? "opacity-40" : ""}`}
            loading="eager"
            decoding="async"
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
            className={`object-cover object-[center_42%] ${failed ? "opacity-40" : ""}`}
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
      <div className="absolute inset-0 bg-black/45 md:hidden" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy-deep via-charcoal/92 to-charcoal/45 md:rounded-3xl md:from-navy-deep md:via-navy/[0.88] md:to-navy/35"
        aria-hidden
      />
      <div className="absolute inset-0 bg-luxury-vignette opacity-75 md:rounded-3xl" aria-hidden />
      <div className="hero-grain absolute inset-0 md:rounded-3xl" aria-hidden />
    </div>
  );
}
