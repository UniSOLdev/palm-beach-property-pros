import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { SiteProjectForm } from "@/components/admin/site-project-form";
import { getAdminProject } from "@/lib/admin/actions/site-projects";
import { listAdminServices } from "@/lib/admin/actions/site-services";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProjectEditPage({ params }: Props) {
  const { id } = await params;

  try {
    const [{ project, media }, services] = await Promise.all([getAdminProject(id), listAdminServices()]);

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
          services={services.map((service) => ({
            id: service.id,
            title: service.title,
            slug: service.slug,
          }))}
          project={{
            id: project.id,
            title: project.title,
            slug: project.slug,
            city: project.city,
            completion_date: project.completion_date,
            service_categories: project.service_categories,
            service_ids: project.service_ids,
            short_summary: project.short_summary,
            long_description: project.long_description,
            cover_image_url: project.cover_image_url,
            cover_media_id: project.cover_media_id,
            source_job_id: project.source_job_id ?? null,
            client_id: project.client_id ?? null,
            legacy_filesystem_id: project.legacy_filesystem_id ?? null,
            testimonial: project.testimonial,
            testimonial_author: project.testimonial_author,
            is_published: project.is_published,
            is_featured: project.is_featured,
            sort_order: project.sort_order,
            media: media.map((item) => ({
              media_asset_id: String(item.media_asset_id),
              gallery_phase: (item.gallery_phase as "before" | "during" | "after" | "general") ?? "general",
              caption: item.caption,
              sort_order: Number(item.sort_order ?? 0),
              preview_url:
                (item.media_assets as { webp_url?: string | null; file_url?: string } | null)?.webp_url ??
                (item.media_assets as { file_url?: string } | null)?.file_url ??
                null,
              alt_text: (item.media_assets as { alt_text?: string | null } | null)?.alt_text ?? null,
            })),
          }}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
