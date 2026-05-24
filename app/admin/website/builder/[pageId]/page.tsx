import { AdminPageHeader } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { NavigationEditorPanel } from "@/components/admin/website-builder/navigation-editor-panel";
import { WebsiteBuilder } from "@/components/admin/website-builder/website-builder";
import { listSiteNavigation } from "@/lib/admin/actions/website-navigation";
import { getBuilderPage } from "@/lib/admin/actions/website-builder";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  try {
    const bundle = await getBuilderPage(pageId);
    return { title: `Builder — ${bundle.page.title}` };
  } catch {
    return { title: "Page builder" };
  }
}

export default async function WebsiteBuilderPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;

  try {
    const [bundle, navItems] = await Promise.all([getBuilderPage(pageId), listSiteNavigation()]);
    return (
      <div className="space-y-4">
        <AdminPageHeader
          title={bundle.page.title}
          subtitle={`Visual builder · ${bundle.page.status === "published" ? "Published" : "Draft"}`}
        />
        <WebsiteBuilder bundle={bundle} />
        <NavigationEditorPanel initialItems={navItems} />
      </div>
    );
  } catch (err) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Page builder" subtitle="Visual CMS" />
        <LoadError
          title="Could not load page"
          message={err instanceof Error ? err.message : "Unknown error"}
          retryHref={`/admin/website/builder/${pageId}`}
        />
      </div>
    );
  }
}
