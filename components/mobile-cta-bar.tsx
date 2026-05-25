import Link from "next/link";
import { PHONE_TEL, QUOTE_PATH, SMS_TEL } from "@/lib/site";

export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/20 bg-cream/95 shadow-lift backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
      <nav
        className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-4 py-3 pb-safe"
        aria-label="Quick contact"
      >
        <a
          href={PHONE_TEL}
          className="flex min-h-[56px] flex-col items-center justify-center rounded-xl border border-navy/10 bg-white text-xs font-semibold text-navy no-underline transition active:scale-[0.98] active:bg-sky/50 hover:bg-sky/40"
        >
          Call
        </a>
        <a
          href={SMS_TEL}
          className="flex min-h-[56px] flex-col items-center justify-center rounded-xl border border-navy/10 bg-white text-xs font-semibold text-ocean no-underline transition active:scale-[0.98] active:bg-sky/50 hover:bg-sky/40"
        >
          Text
        </a>
        <Link
          href={QUOTE_PATH}
          className="flex min-h-[56px] flex-col items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-xs font-bold text-white no-underline shadow-lg ring-2 ring-ocean/35 transition active:scale-[0.98] hover:shadow-xl"
        >
          Get Quote
        </Link>
      </nav>
    </div>
  );
}
