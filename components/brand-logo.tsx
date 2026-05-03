import Image from "next/image";
import Link from "next/link";

/** Matches public/logo.png intrinsic dimensions (do not stretch). */
const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 682;

type BrandLogoProps = {
  variant?: "header" | "footer";
  className?: string;
};

/**
 * Full lockup — white mat behind asset removes baked-in edge; object-contain preserves aspect ratio.
 */
export function BrandLogo({ variant = "header", className = "" }: BrandLogoProps) {
  const isHeader = variant === "header";
  const sizes = isHeader
    ? "(max-width: 640px) 200px, (max-width: 1024px) 220px, 240px"
    : "(max-width: 640px) 260px, 300px";

  const dimensionClass = isHeader
    ? "h-10 max-h-12 w-auto max-w-[min(100%,15rem)] sm:h-11 sm:max-h-[3rem] md:h-12 md:max-h-[3.25rem]"
    : "h-12 w-auto max-w-[min(100%,18rem)] sm:h-14 sm:max-h-[4rem] md:h-16 md:max-h-[4.5rem]";

  return (
    <Link
      href="/"
      className={`inline-flex max-w-full shrink-0 items-center no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean ${className}`}
      aria-label="Palm Beach Property Pros home"
    >
      {isHeader ? (
        <span className="inline-block rounded-md bg-white p-2 ring-0">
          <Image
            src="/logo.png"
            alt="Palm Beach Property Pros"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            priority
            sizes={sizes}
            className={`${dimensionClass} object-contain object-left`}
          />
        </span>
      ) : (
        <Image
          src="/logo.png"
          alt="Palm Beach Property Pros"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          sizes={sizes}
          className={`${dimensionClass} object-contain object-left`}
        />
      )}
    </Link>
  );
}
