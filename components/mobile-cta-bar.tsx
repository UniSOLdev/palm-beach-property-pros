import Link from "next/link";
import { PHONE_TEL, QUOTE_PATH, SMS_TEL } from "@/lib/site";

export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/25 bg-cream/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(10,37,64,0.14)] backdrop-blur-xl md:hidden">
      <nav
        className="mx-auto grid max-w-6xl grid-cols-[1fr_1fr_1.35fr] gap-2 px-4 py-3 pb-safe"
        aria-label="Quick contact"
      >
        <a
          href={PHONE_TEL}
          className="flex min-h-[56px] flex-col items-center justify-center rounded-2xl border border-navy/10 bg-white text-xs font-semibold text-navy no-underline transition duration-200 active:scale-[0.98] active:bg-sky/50 hover:bg-sky/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
        >
          Call
        </a>
        <a
          href={SMS_TEL}
          className="flex min-h-[56px] flex-col items-center justify-center rounded-2xl border border-navy/10 bg-white text-xs font-semibold text-ocean no-underline transition duration-200 active:scale-[0.98] active:bg-sky/50 hover:bg-sky/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
        >
          Text
        </a>
        <Link
          href={QUOTE_PATH}
          className="flex min-h-[56px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-aqua via-ocean to-navy text-xs font-bold text-white no-underline shadow-lg shadow-ocean/30 ring-2 ring-aqua/40 transition duration-200 active:scale-[0.98] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
        >
          Get Quote
        </Link>
      </nav>
    </div>
  );
}
