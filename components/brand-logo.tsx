import Image from "next/image";
import Link from "next/link";

/** Circular emblem — transparent WebP derived from brand artwork. */
const EMBLEM_WIDTH = 1024;
const EMBLEM_HEIGHT = 682;

const WORDMARK = {
  src: "/brand/pbpp-wordmark-light.svg",
  width: 280,
  height: 48,
} as const;

type BrandLogoProps = {
  variant?: "header" | "footer" | "emblem";
  className?: string;
};

/**
 * Brand lockups for dark backgrounds (header/footer).
 * Wordmark in header; transparent emblem in footer — no white mat or black JPEG background.
 */
export function BrandLogo({ variant = "header", className = "" }: BrandLogoProps) {
  const linkClass = `inline-flex max-w-full shrink-0 items-center no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean ${className}`;

  if (variant === "emblem" || variant === "footer") {
    return (
      <Link href="/" className={linkClass} aria-label="Palm Beach Property Pros home">
        <Image
          src="/brand/logo-emblem.webp"
          alt="Palm Beach Property Pros"
          width={EMBLEM_WIDTH}
          height={EMBLEM_HEIGHT}
          sizes="(max-width: 640px) 260px, 300px"
          className="h-14 w-auto max-w-[min(100%,16rem)] object-contain object-left sm:h-16 sm:max-w-[18rem] md:h-[4.5rem] md:max-w-[20rem]"
        />
      </Link>
    );
  }

  return (
    <Link href="/" className={linkClass} aria-label="Palm Beach Property Pros home">
      <Image
        src={WORDMARK.src}
        alt="Palm Beach Property Pros"
        width={WORDMARK.width}
        height={WORDMARK.height}
        priority
        sizes="(max-width: 640px) 200px, (max-width: 1024px) 220px, 240px"
        className="h-9 w-auto max-w-[11.5rem] object-contain object-left sm:h-10 sm:max-w-[13.5rem] md:h-11 md:max-w-[15.5rem]"
      />
    </Link>
  );
}
