import Image from "next/image";
import Link from "next/link";

/** Matches public/logo.png intrinsic dimensions (do not stretch). */
const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 682;

type BrandLogoProps = {
  variant?: "header" | "footer";
  className?: string;
  /** Optional CMS override (https URL from Supabase Storage or CDN). */
  logoSrc?: string | null;
};

/**
 * Full lockup (mark + wordmark) from a single asset — height-constrained, width auto, object-contain.
 */
export function BrandLogo({ variant = "header", className = "", logoSrc }: BrandLogoProps) {
  const isHeader = variant === "header";
  const sizes = isHeader
    ? "(max-width: 640px) 200px, (max-width: 1024px) 220px, 240px"
    : "(max-width: 640px) 260px, 300px";

  const dimensionClass = isHeader
    ? "h-10 max-h-12 w-auto max-w-[min(100%,15rem)] sm:h-11 sm:max-h-[3rem] md:h-12 md:max-h-[3.25rem]"
    : "h-12 w-auto max-w-[min(100%,18rem)] sm:h-14 sm:max-h-[4rem] md:h-16 md:max-h-[4.5rem]";

  const src = logoSrc?.trim() || "/logo.png";
  const isRemote = src.startsWith("http://") || src.startsWith("https://");

  return (
    <Link
      href="/"
      className={`inline-flex max-w-full shrink-0 items-center no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean ${className}`}
      aria-label="Palm Beach Property Pros home"
    >
      <Image
        src={src}
        alt="Palm Beach Property Pros"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={isHeader}
        sizes={sizes}
        unoptimized={isRemote}
        className={`${dimensionClass} object-contain object-left`}
      />
    </Link>
  );
}
