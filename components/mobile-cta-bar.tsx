import Link from "next/link";
import { PHONE_DISPLAY, PHONE_TEL, QUOTE_PATH } from "@/lib/site";

/** Always-visible tap-to-call bar on phones. */
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-cream/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(8,26,46,0.15)] backdrop-blur-md md:hidden">
      <nav className="grid grid-cols-[1.6fr_1fr] gap-2 px-3 py-2.5" aria-label="Quick contact">
        <a
          href={PHONE_TEL}
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-navy text-[1.05rem] font-semibold text-cream no-underline active:bg-navy-deep"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
          </svg>
          <span>Call {PHONE_DISPLAY}</span>
        </a>
        <Link
          href={QUOTE_PATH}
          className="flex min-h-[56px] items-center justify-center rounded-full bg-brass text-lg font-semibold text-navy-deep no-underline active:bg-brass-light"
        >
          Get a quote
        </Link>
      </nav>
    </div>
  );
}
