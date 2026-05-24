import { checkSiteStudioHealth } from "@/lib/admin/actions/site-studio-health";
import { listWebsitePages } from "@/lib/admin/actions/website-builder";
import { formatSiteStudioError } from "@/lib/cms/website-schemas";
import { SiteStudioHub } from "@/components/admin/website-builder/site-studio-hub";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Studio" };

export default async function WebsiteAdminPage() {
  const health = await checkSiteStudioHealth();

  let pages: Awaited<ReturnType<typeof listWebsitePages>> = [];
  let loadError = "";

  if (health.ready) {
    try {
      pages = await listWebsitePages();
    } catch (err) {
      loadError = err instanceof Error ? formatSiteStudioError(err.message) : "Could not load pages";
    }
  } else {
    loadError = health.error ?? "Site Studio tables are not installed.";
  }

  return (
    <SiteStudioHub
      pages={pages}
      health={health}
      loadError={loadError || null}
    />
  );
}
