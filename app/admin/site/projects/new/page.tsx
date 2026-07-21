import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { SiteProjectForm } from "@/components/admin/site-project-form";

export default function AdminNewProjectPage() {
  return (
    <div className="space-y-4">
      <Link href="/admin/site/projects" className="text-sm font-semibold text-ocean no-underline hover:underline">
        ← Projects
      </Link>
      <AdminPageHeader title="New project" subtitle="Create a case study from a completed job" />
      <SiteProjectForm />
    </div>
  );
}
