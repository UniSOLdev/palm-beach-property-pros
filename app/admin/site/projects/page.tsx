import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { listAdminProjects } from "@/lib/admin/actions/site-projects";
import { formatDate } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  let projects: Awaited<ReturnType<typeof listAdminProjects>> = [];
  let error = "";

  try {
    projects = await listAdminProjects();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load projects";
  }

  return (
    <div className="space-y-4 pb-8">
      <Link href="/admin/site" className="text-sm font-semibold text-ocean no-underline hover:underline">
        ← Website CMS
      </Link>
      <AdminPageHeader title="Projects" subtitle="Recent work and case studies" />

      <Link href="/admin/site/projects/new" className="admin-btn inline-flex min-h-[48px] no-underline">
        New project
      </Link>

      {error ? (
        <div className="admin-card text-sm text-red-700">{error}</div>
      ) : !projects.length ? (
        <div className="admin-card space-y-3 text-sm text-charcoal/75">
          <p className="font-medium text-navy">No projects yet</p>
          <p>
            Create a case study from completed field work, attach media from the library, assign services, and publish
            when ready. Published projects appear on the homepage and at <code>/projects</code>.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/admin/site/projects/${project.id}`}
                className="admin-card block no-underline"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy">{project.title}</p>
                    <p className="text-xs text-charcoal/60">
                      {project.city ?? "Palm Beach County"}
                      {project.completion_date ? ` · ${formatDate(project.completion_date)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.is_featured ? (
                      <span className="admin-chip bg-ocean/15 text-ocean">Featured</span>
                    ) : null}
                    <span
                      className={`admin-chip ${project.is_published ? "bg-leaf/20 text-leaf" : "bg-charcoal/10 text-charcoal/70"}`}
                    >
                      {project.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
