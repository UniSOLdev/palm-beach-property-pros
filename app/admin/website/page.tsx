import Link from "next/link";
import { CmsStudio } from "@/components/admin/cms-studio";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { TaskWorkflowBar } from "@/components/admin/task-workflow-bar";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { HOME_CMS_DEFAULTS } from "@/lib/cms/home";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Studio" };

export default async function WebsiteAdminPage() {
  const crew = await listCrewOptions();
  const supabase = await createClient();
  const { data } = await supabase.from("cms_sections").select("*").eq("page_key", "home").order("sort_order");

  const sections = Object.keys(HOME_CMS_DEFAULTS).map((key) => {
    const row = data?.find((r) => r.section_key === key);
    return {
      section_key: key,
      title: row?.title ?? key.replace(/_/g, " "),
      content: (row?.content as Record<string, unknown>) ?? HOME_CMS_DEFAULTS[key],
    };
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Site Studio"
        subtitle="Homepage sections, galleries, SEO — database-driven CMS"
      />
      <Link href="/admin/website/media" className="admin-btn-secondary inline-flex no-underline">
        Open media library
      </Link>
      <TaskQuickAdd crew={crew} variant="primary" label="+ Add website task" className="w-full" defaults={{ category: "Website Update" }} />
      <TaskWorkflowBar context="website" defaults={{ category: "Website Update" }} />
      <CmsStudio sections={sections} />
    </div>
  );
}
