import { TRUST_BAR_ITEMS } from "@/lib/homepage-services";

export function TrustBar() {
  return (
    <section aria-label="Why customers trust us" className="border-y border-navy/[0.06] bg-white/80 py-4">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-2 text-center text-xs font-medium text-charcoal/75 sm:text-sm">
        {TRUST_BAR_ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
