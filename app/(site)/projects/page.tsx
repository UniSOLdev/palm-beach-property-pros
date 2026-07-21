import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteProjects } from "@/lib/site-content/queries";
import { PROJECT_CATEGORY_LABELS, type ProjectCategory } from "@/lib/site-content/types";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Recent Work & Projects",
  description: `Recent property care projects by ${SITE_NAME} in Palm Beach County — estate cleanup, window detailing, pressure washing, and maintenance.`,
};

export default async function ProjectsIndexPage() {
  const projects = await getSiteProjects({ publishedOnly: true });

  return (
    <div className="bg-cream">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Portfolio</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Recent work &amp; projects
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-charcoal/85">
          Case studies and documented field work across Palm Beach County. Only published projects with
          owner-approved photos appear here.
        </p>

        {!projects.length ? (
          <div className="mt-10 rounded-xl border border-navy/10 bg-white p-8 text-sm text-charcoal/75">
            Published projects will appear here once the owner adds real job photos and publishes case
            studies in the admin Project Manager.
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="block rounded-2xl border border-navy/10 bg-white p-6 no-underline shadow-md transition hover:shadow-lift"
                >
                  <div className="flex flex-wrap gap-2">
                    {project.service_categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full bg-sky/60 px-2.5 py-1 text-[11px] font-semibold text-navy"
                      >
                        {PROJECT_CATEGORY_LABELS[cat as ProjectCategory] ?? cat}
                      </span>
                    ))}
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-navy">{project.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/85">{project.short_summary}</p>
                  {project.city ? (
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-charcoal/55">
                      {project.city}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
