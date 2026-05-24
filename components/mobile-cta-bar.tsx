import Link from "next/link";
import { PHONE_TEL, QUOTE_PATH, SMS_TEL } from "@/lib/site";

export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/20 bg-cream/95 pb-safe shadow-lift backdrop-blur-xl md:hidden">
      <nav
        className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-4 py-2.5"
        aria-label="Quick contact"
      >
        <a
          href={PHONE_TEL}
          className="flex min-h-[48px] flex-col items-center justify-center rounded-xl border border-navy/10 bg-white text-xs font-semibold text-navy no-underline transition hover:bg-sky/40"
        >
          Call
        </a>
        <a
          href={SMS_TEL}
          className="flex min-h-[48px] flex-col items-center justify-center rounded-xl border border-navy/10 bg-white text-xs font-semibold text-ocean no-underline transition hover:bg-sky/40"
        >
          Text
        </a>
        <Link
          href={QUOTE_PATH}
          className="flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-xs font-semibold text-white no-underline shadow-md ring-1 ring-white/10 transition hover:shadow-lg"
        >
          Get Quote
        </Link>
      </nav>
    </div>
  );
}
