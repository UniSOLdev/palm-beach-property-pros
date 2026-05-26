import { BeforeAfterCompare } from "@/components/media/before-after-compare";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import type { TransformationProject } from "@/lib/media/types";

export function TransformationShowcase({
  projects,
}: {
  projects: readonly TransformationProject[];
}) {
  const featured = projects[0];
  if (!featured) return null;

  return (
    <ScrollReveal>
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow text-ocean">Documented execution</p>
          <h2 className="section-title mt-4">Transformation storytelling</h2>
          <p className="section-lead">
            Before-and-after proof, field timelines, and project recaps—built for owners who expect
            documented operations, not marketing promises.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-14">
          <BeforeAfterCompare project={featured} />

          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aqua-muted">
              {featured.timeframe}
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-navy">{featured.title}</h3>
            <p className="mt-1 text-sm text-charcoal/60">{featured.location}</p>
            <p className="mt-5 text-sm leading-relaxed text-charcoal/75">{featured.summary}</p>
            <p className="mt-6 text-sm font-semibold text-navy">Scope handled</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {featured.scope.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-navy/[0.08] bg-white/80 px-3 py-1.5 text-xs font-medium text-charcoal/75"
                >
                  {item}
                </li>
              ))}
            </ul>
            {projects.length > 1 ? (
              <div className="mt-10 space-y-6 border-t border-navy/[0.08] pt-8">
                {projects.slice(1).map((project) => (
                  <div key={project.id}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-aqua-muted">
                      {project.timeframe}
                    </p>
                    <h4 className="mt-2 font-semibold text-navy">{project.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{project.summary}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
