import Link from "next/link";
import { LINKR_URL, linkrRel } from "@/lib/linkr";

export function MobileCtaBar({
  bookingHref = "/quote",
  bookingLabel = "Get a quote",
}: {
  bookingHref?: string;
  bookingLabel?: string;
}) {
  const bookingExternal = bookingHref.startsWith("http");

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-cream/95 pb-safe shadow-[0_-8px_30px_rgba(12,35,64,0.12)] backdrop-blur-md md:hidden">
      <nav className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 py-2" aria-label="Quick contact">
        <a
          href={LINKR_URL}
          target="_blank"
          rel={linkrRel}
          className="flex flex-col items-center justify-center rounded-lg py-2 text-xs font-semibold text-navy no-underline transition hover:bg-sky/50"
        >
          Call
        </a>
        <a
          href={LINKR_URL}
          target="_blank"
          rel={linkrRel}
          className="flex flex-col items-center justify-center rounded-lg py-2 text-xs font-semibold text-ocean no-underline transition hover:bg-sky/50"
        >
          Text
        </a>
        {bookingExternal ? (
          <a
            href={bookingHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center rounded-lg bg-navy py-2 text-center text-xs font-semibold text-white no-underline transition hover:bg-ocean"
          >
            {bookingLabel}
          </a>
        ) : (
          <Link
            href={bookingHref}
            className="flex flex-col items-center justify-center rounded-lg bg-navy py-2 text-center text-xs font-semibold text-white no-underline transition hover:bg-ocean"
          >
            {bookingLabel}
          </Link>
        )}
      </nav>
    </div>
  );
}
