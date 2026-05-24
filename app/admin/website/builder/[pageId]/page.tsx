import { AdminPageHeader } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { WebsiteBuilder } from "@/components/admin/website-builder/website-builder";
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
    const bundle = await getBuilderPage(pageId);
    return <WebsiteBuilder bundle={bundle} />;
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
