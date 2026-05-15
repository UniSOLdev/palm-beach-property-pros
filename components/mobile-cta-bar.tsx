import { LINKR_URL, linkrRel } from "@/lib/linkr";
import { PHONE_TEL } from "@/lib/site";

export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-graphite/95 pb-safe shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden">
      <nav
        className="mx-auto grid max-w-lg grid-cols-2 gap-2 px-3 py-2"
        aria-label="Quick contact"
      >
        <a
          href={PHONE_TEL}
          className="flex flex-col items-center justify-center rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-cream no-underline transition hover:border-aqua/40"
        >
          Call or Text
        </a>
        <a
          href={LINKR_URL}
          target="_blank"
          rel={linkrRel}
          className="flex flex-col items-center justify-center rounded-xl bg-cream py-2.5 text-xs font-semibold text-graphite no-underline shadow-glow transition hover:bg-white"
        >
          Get Free Quote
        </a>
      </nav>
    </div>
  );
}
