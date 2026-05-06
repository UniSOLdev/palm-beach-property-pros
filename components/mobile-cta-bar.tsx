import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { PHONE_TEL } from "@/lib/site";

export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-cream/95 pb-safe shadow-[0_-8px_30px_rgba(12,35,64,0.12)] backdrop-blur-md md:hidden">
      <nav
        className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-6 py-2.5"
        aria-label="Quick contact"
      >
        <a
          href={PHONE_TEL}
          className="flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-semibold text-navy no-underline shadow-sm transition duration-300 hover:bg-sky/60 hover:shadow-sm"
        >
          Call
        </a>
        <a
          href={LINKR_URL}
          target="_blank"
          rel={linkrRel}
          className="flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-semibold text-ocean no-underline shadow-sm transition duration-300 hover:bg-sky/60 hover:shadow-sm"
        >
          Text
        </a>
        <a
          href={LINKR_URL}
          target="_blank"
          rel={linkrRel}
          className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean py-2.5 text-xs font-semibold text-white no-underline shadow-md ring-1 ring-white/10 transition duration-300 hover:shadow-lg hover:brightness-105"
        >
          Get Quote
        </a>
      </nav>
    </div>
  );
}
