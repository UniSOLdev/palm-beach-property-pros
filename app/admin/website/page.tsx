import Link from "next/link";
import { CmsStudio } from "@/components/admin/cms-studio";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { HOME_CMS_DEFAULTS } from "@/lib/cms/home";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Studio" };

export default async function WebsiteAdminPage() {
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
      <CmsStudio sections={sections} />
    </div>
  );
}
