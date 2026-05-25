"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

export function HeroBackground({ src, alt }: { src: string; alt: string }) {
  const [offset, setOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);

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
        <Image
          src={src}
          alt={alt}
          fill
          priority
          placeholder="blur"
          blurDataURL={BLUR}
          className="animate-ken-burns object-cover object-[center_42%] saturate-[0.88] brightness-[0.72] contrast-[1.08]"
          sizes="100vw"
          onLoad={() => setLoaded(true)}
        />
      </div>
      <div className="absolute inset-0 bg-black/55 md:hidden" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy-deep via-charcoal/95 to-charcoal/50 md:rounded-3xl md:from-navy-deep md:via-navy/[0.92] md:to-navy/30"
        aria-hidden
      />
      <div className="absolute inset-0 bg-luxury-radial opacity-90 md:rounded-3xl" aria-hidden />
      <div className="absolute inset-0 bg-luxury-vignette md:rounded-3xl" aria-hidden />
      <div className="hero-glow absolute inset-0 md:rounded-3xl" aria-hidden />
      <div className="hero-grain absolute inset-0 md:rounded-3xl" aria-hidden />
    </div>
  );
}
