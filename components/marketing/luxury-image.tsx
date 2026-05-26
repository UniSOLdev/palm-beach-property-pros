"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

type LuxuryImageProps = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  overlay?: "cinematic" | "card" | "subtle" | "none";
  hoverScale?: boolean;
  blurDataURL?: string;
};

export function LuxuryImage({
  overlay = "none",
  hoverScale = false,
  className = "",
  fill,
  alt,
  onLoad,
  blurDataURL,
  ...props
}: LuxuryImageProps) {
  const [loaded, setLoaded] = useState(false);

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
        alt={alt}
        fill={fill}
        placeholder="blur"
        blurDataURL={blurDataURL ?? BLUR}
        className={`${hoverScale ? "transition duration-[1.4s] ease-out group-hover/image:scale-[1.012]" : ""} ${className}`}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
      />
      {overlay !== "none" && <div className={`${overlayClass} absolute inset-0 z-[2]`} aria-hidden />}
    </div>
  );
}
