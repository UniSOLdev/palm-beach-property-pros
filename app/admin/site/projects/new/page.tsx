import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { SiteProjectForm } from "@/components/admin/site-project-form";
import { listAdminServices } from "@/lib/admin/actions/site-services";

export const dynamic = "force-dynamic";

export default async function AdminNewProjectPage() {
  const services = await listAdminServices();

  return (
    <div className="space-y-4">
      <Link href="/admin/site/projects" className="text-sm font-semibold text-ocean no-underline hover:underline">
        ← Projects
      </Link>
      <AdminPageHeader title="New project" subtitle="Create a case study from a completed job" />
      <SiteProjectForm
        services={services.map((service) => ({
          id: service.id,
          title: service.title,
          slug: service.slug,
        }))}
      />
    </div>
  );
}
