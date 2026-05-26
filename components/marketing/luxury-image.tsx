"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { MEDIA_UNAVAILABLE_PLACEHOLDER } from "@/lib/media/resolve";

const BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

type LuxuryImageProps = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  overlay?: "cinematic" | "card" | "subtle" | "none";
  hoverScale?: boolean;
  blurDataURL?: string;
  assetId?: string;
};

export function LuxuryImage({
  overlay = "none",
  hoverScale = false,
  className = "",
  fill,
  alt,
  src,
  onLoad,
  onError,
  blurDataURL,
  assetId,
  unoptimized,
  ...props
}: LuxuryImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const initialSrc = typeof src === "string" && src.trim() ? src : MEDIA_UNAVAILABLE_PLACEHOLDER;
  const displaySrc = failed ? MEDIA_UNAVAILABLE_PLACEHOLDER : initialSrc;
  const isLocal = displaySrc.startsWith("/");

  const overlayClass =
    overlay === "cinematic"
      ? "image-overlay-cinematic"
      : overlay === "card"
        ? "image-overlay-card"
        : overlay === "subtle"
          ? "image-overlay-subtle"
          : "";

  return (
    <div
      className={`image-reveal-root relative overflow-hidden ${fill ? "absolute inset-0" : ""} ${hoverScale ? "group/image" : ""} ${loaded ? "is-loaded" : ""}`}
    >
      {!loaded && <div className="image-skeleton absolute inset-0 z-[1]" aria-hidden />}
      <Image
        {...props}
        src={displaySrc}
        alt={failed ? "Media unavailable" : alt}
        fill={fill}
        unoptimized={unoptimized ?? isLocal}
        placeholder={failed ? "empty" : "blur"}
        blurDataURL={failed ? undefined : blurDataURL ?? BLUR}
        className={`${failed ? "object-contain p-8 opacity-30" : ""} ${hoverScale ? "transition duration-[1.4s] ease-out group-hover/image:scale-[1.012]" : ""} ${className}`}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          if (!failed) {
            console.warn(
              "[PBPP Media Render]",
              JSON.stringify({ level: "warn", assetId, src: initialSrc, message: "image load failed" }),
            );
            setFailed(true);
            setLoaded(true);
          }
          onError?.(e);
        }}
      />
      {failed ? (
        <div className="pointer-events-none absolute inset-0 z-[3] flex items-end justify-center pb-6">
          <p className="rounded-full bg-navy-deep/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/80">
            Media unavailable
          </p>
        </div>
      ) : null}
      {overlay !== "none" && !failed ? <div className={`${overlayClass} absolute inset-0 z-[2]`} aria-hidden /> : null}
    </div>
  );
}
