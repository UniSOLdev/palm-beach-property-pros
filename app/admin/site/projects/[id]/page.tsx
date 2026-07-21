import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { SiteProjectForm } from "@/components/admin/site-project-form";
import { getAdminProject } from "@/lib/admin/actions/site-projects";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProjectEditPage({ params }: Props) {
  const { id } = await params;

  try {
    const { project } = await getAdminProject(id);

    return (
      <div className="space-y-4">
        <Link href="/admin/site/projects" className="text-sm font-semibold text-ocean no-underline hover:underline">
          ← Projects
        </Link>
        <AdminPageHeader title={project.title} subtitle={`Edit /projects/${project.slug}`} />
        {project.is_published ? (
          <a
            href={`/projects/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-ocean"
          >
            Preview public page ↗
          </a>
        ) : null}
        <SiteProjectForm
          project={{
            id: project.id,
            title: project.title,
            slug: project.slug,
            city: project.city,
            completion_date: project.completion_date,
            service_categories: project.service_categories,
            short_summary: project.short_summary,
            long_description: project.long_description,
            cover_image_url: project.cover_image_url,
            cover_media_id: project.cover_media_id,
            testimonial: project.testimonial,
            testimonial_author: project.testimonial_author,
            is_published: project.is_published,
            is_featured: project.is_featured,
            sort_order: project.sort_order,
            media: [],
          }}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
