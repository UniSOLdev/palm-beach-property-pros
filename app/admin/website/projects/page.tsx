import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/entity-list";
import { listProjectsAction } from "@/lib/admin/actions/projects";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects · Site Studio" };

export default async function AdminProjectsPage() {
  const projects = await listProjectsAction();

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Projects"
        subtitle="Structured project recaps — scope, location, turnaround, and featured media"
        actionHref="/admin/website/transformations"
        actionLabel="Transformations"
      />
      <ul className="space-y-3">
        {!projects.length ? (
          <EmptyState>No projects yet. Create one after running the CMS v2 migration.</EmptyState>
        ) : (
          projects.map((project) => (
            <li key={project.id} className="admin-card flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{project.title}</p>
                <p className="text-xs text-charcoal/60">
                  {project.location ?? "Location TBD"} · {project.category ?? "General"}
                  {project.featured ? " · Featured" : ""}
                </p>
                {project.summary ? <p className="mt-2 text-sm text-charcoal/75">{project.summary}</p> : null}
              </div>
              <Link href="/admin/website/transformations" className="text-xs font-semibold text-ocean no-underline">
                Pairs →
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
