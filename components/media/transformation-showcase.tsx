import { BeforeAfterCompare } from "@/components/media/before-after-compare";
import type { TransformationProject } from "@/lib/media/types";

export function TransformationShowcase({
  projects,
  isAuthentic = false,
}: {
  projects: readonly TransformationProject[];
  isAuthentic?: boolean;
}) {
  const featured = projects[0];
  if (!featured) return null;

  return (
    <section className="transformation-proof-band relative py-16 md:py-24">
      <div className="absolute inset-0 bg-luxury-mesh opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-2xl text-center">
        <p className="section-eyebrow text-ocean">Transformation proof</p>
        <h2 className="section-title mt-4">
          {isAuthentic ? "Documented estate restoration" : "Transformation storytelling"}
        </h2>
        <p className="section-lead">
          {isAuthentic
            ? "Real before-and-after contrast from Palm Beach County field work—drag the slider to compare."
            : "Before-and-after proof built for owners who expect documented operations."}
        </p>
      </div>

      <div className="relative mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-14">
        <div>
          <BeforeAfterCompare project={featured} />
          {isAuthentic ? (
            <div className="mt-4 flex justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-charcoal/50">
              <span>Neglected</span>
              <span>Restored</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-center lg:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua-muted">
            {featured.timeframe}
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-navy md:text-2xl">{featured.title}</h3>
          <p className="mt-1 text-sm text-charcoal/60">{featured.location}</p>
          <p className="mt-5 text-sm leading-relaxed text-charcoal/75 md:text-base">{featured.summary}</p>
          <p className="mt-6 text-sm font-semibold text-navy">Scope handled</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {featured.scope.map((item) => (
              <li
                key={item}
                className="rounded-full border border-navy/[0.08] bg-white/90 px-3 py-1.5 text-xs font-medium text-charcoal/75 shadow-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
