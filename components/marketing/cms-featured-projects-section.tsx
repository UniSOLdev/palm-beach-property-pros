import Link from "next/link";
import type { SiteProject } from "@/lib/site-content/types";
import { PROJECT_CATEGORY_LABELS, resolveMediaUrl, type ProjectCategory } from "@/lib/site-content/types";

export function CmsFeaturedProjectsSection({ projects }: { projects: SiteProject[] }) {
  if (!projects.length) return null;

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-eyebrow text-ocean">Recent work</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy">Projects &amp; case studies</h2>
          </div>
          <Link href="/projects" className="text-sm font-semibold text-ocean hover:underline">
            View all projects →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const coverSrc = resolveMediaUrl(project.cover_media) ?? project.cover_image_url;
            return (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="group overflow-hidden rounded-2xl border border-navy/10 bg-cream no-underline shadow-sm transition hover:shadow-lift"
            >
              {coverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverSrc} alt={project.title} className="aspect-[16/10] w-full object-cover" loading="lazy" />
              ) : null}
              <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {project.service_categories.slice(0, 2).map((cat) => (
                  <span key={cat} className="rounded-full bg-sky/60 px-2.5 py-1 text-[11px] font-semibold text-navy">
                    {PROJECT_CATEGORY_LABELS[cat as ProjectCategory] ?? cat}
                  </span>
                ))}
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy group-hover:text-ocean">{project.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/80">{project.short_summary}</p>
              {project.city ? (
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-charcoal/55">
                  {project.city}
                </p>
              ) : null}
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
