import Image from "next/image";
import Link from "next/link";

import { LOGO_INTRINSIC, LOGO_RASTER_PATH, LOGO_WORDMARK_LIGHT_SVG } from "@/lib/brand-assets";

export type BrandLogoSurface = "dark" | "light";

type BrandLogoProps = {
  variant?: "header" | "footer";
  /** Dark = nav/footer on graphite/navy. Light = cream panels (raster, no blend). */
  surface?: BrandLogoSurface;
  className?: string;
  /** Optional CMS override (https URL from Supabase Storage or CDN). */
  logoSrc?: string | null;
};

const sizeByVariant = {
  header: {
    dark: "h-7 w-auto max-w-[9.5rem] sm:h-8 sm:max-w-[10.5rem]",
    light: "h-8 w-auto max-w-[10.5rem] sm:h-9",
  },
  footer: {
    dark: "h-7 w-auto max-w-[10rem] sm:h-8",
    light: "h-9 w-auto max-w-[11rem] sm:h-10",
  },
} as const;

const svgSizeByVariant = {
  header: "h-[1.35rem] w-auto sm:h-6",
  footer: "h-6 w-auto sm:h-[1.65rem]",
} as const;

/**
 * Brand lockup — SVG wordmark on dark chrome; raster with screen blend when CMS/custom image is used.
 */
export function BrandLogo({
  variant = "header",
  surface = "dark",
  className = "",
  logoSrc,
}: BrandLogoProps) {
  const isHeader = variant === "header";
  const custom = logoSrc?.trim() || null;
  const useRaster = Boolean(custom) || surface === "light";
  const rasterSrc = custom ?? LOGO_RASTER_PATH;
  const isRemote = rasterSrc.startsWith("http://") || rasterSrc.startsWith("https://");

  const sizes = isHeader
    ? "(max-width: 640px) 140px, (max-width: 1024px) 160px, 180px"
    : "(max-width: 640px) 160px, 200px";

  const rasterClass = [
    sizeByVariant[variant][surface],
    "object-contain object-left",
    surface === "dark" ? "logo-raster-on-dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href="/"
      className={`group inline-flex max-w-full shrink-0 items-center no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua/80 ${className}`}
      aria-label="Palm Beach Property Pros home"
    >
      {useRaster ? (
        <span className="inline-flex items-center leading-none">
          <Image
            src={rasterSrc}
            alt=""
            width={LOGO_INTRINSIC.width}
            height={LOGO_INTRINSIC.height}
            priority={isHeader}
            sizes={sizes}
            unoptimized={isRemote}
            className={rasterClass}
          />
        </span>
      ) : (
        <Image
          src={LOGO_WORDMARK_LIGHT_SVG}
          alt=""
          width={320}
          height={48}
          priority={isHeader}
          className={`${svgSizeByVariant[variant]} w-auto object-contain object-left opacity-[0.97] transition-opacity duration-300 group-hover:opacity-100`}
        />
      )}
    </Link>
  );
}
