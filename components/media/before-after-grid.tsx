import { buildMediaUrl } from "@/lib/media/resolve";
import type { BeforeAfterPair } from "@/lib/media-curation/types";

export function BeforeAfterGrid({ pairs }: { pairs: BeforeAfterPair[] }) {
  if (pairs.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {pairs.map((pair) => (
        <article
          key={pair.id}
          className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-card transition duration-500 hover:shadow-lift md:rounded-3xl"
        >
          <div className="grid grid-cols-2 gap-px bg-navy/[0.08]">
            <div className="relative aspect-[3/4] bg-navy-deep/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildMediaUrl(pair.before.src, 900)}
                alt={pair.before.alt}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <span className="absolute left-2 top-2 rounded-full bg-navy-deep/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-cream backdrop-blur-sm">
                Before
              </span>
            </div>
            <div className="relative aspect-[3/4] bg-navy-deep/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildMediaUrl(pair.after.src, 900)}
                alt={pair.after.alt}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <span className="absolute right-2 top-2 rounded-full bg-aqua/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-navy backdrop-blur-sm">
                After
              </span>
            </div>
          </div>
          <p className="px-4 py-3 text-sm font-medium text-navy md:px-5">{pair.label}</p>
        </article>
      ))}
    </div>
  );
}
