import { ProjectRecapCard } from "@/components/media/project-recap-card";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import type { ProjectRecap } from "@/lib/media/types";

export function FeaturedProjectsSection({
  projects,
}: {
  projects: readonly ProjectRecap[];
}) {
  return (
    <ScrollReveal delay={80}>
      <section className="section-band-muted relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-luxury-mesh opacity-35" aria-hidden />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="section-eyebrow text-ocean">Field programs</p>
          <h2 className="section-title mt-4">Project recaps &amp; operational examples</h2>
          <p className="section-lead">
            Recurring estate support, turnover cadence, and seasonal opens—structured the way property
            managers and homeowners actually review vendor performance.
          </p>
        </div>
        <div className="relative mt-12 grid gap-8 md:mt-16 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectRecapCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
