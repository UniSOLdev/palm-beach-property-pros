import { LINKR_URL, linkrRel } from "@/lib/linkr";

export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-cream/95 pb-safe shadow-[0_-8px_30px_rgba(12,35,64,0.12)] backdrop-blur-md md:hidden">
      <nav
        className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-6 py-2"
        aria-label="Quick contact"
      >
        <a
          href={LINKR_URL}
          target="_blank"
          rel={linkrRel}
          className="flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-semibold text-navy no-underline shadow-sm transition hover:bg-sky/50"
        >
          Call
        </a>
        <a
          href={LINKR_URL}
          target="_blank"
          rel={linkrRel}
          className="flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-semibold text-ocean no-underline shadow-sm transition hover:bg-sky/50"
        >
          Text
        </a>
        <a
          href={LINKR_URL}
          target="_blank"
          rel={linkrRel}
          className="flex flex-col items-center justify-center rounded-xl bg-navy py-2.5 text-xs font-semibold text-white no-underline shadow-md transition hover:bg-ocean"
        >
          Get Quote
        </a>
      </nav>
    </div>
  );
}
