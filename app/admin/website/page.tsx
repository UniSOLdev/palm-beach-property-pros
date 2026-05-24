import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { TaskWorkflowBar } from "@/components/admin/task-workflow-bar";
import { listWebsitePages } from "@/lib/admin/actions/website-builder";
import { listCrewOptions } from "@/lib/admin/actions/tasks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Studio" };

export default async function WebsiteAdminPage() {
  let crew: Awaited<ReturnType<typeof listCrewOptions>> = [];
  let pages: Awaited<ReturnType<typeof listWebsitePages>> = [];
  let builderError = "";

  try {
    crew = await listCrewOptions();
  } catch {
    /* non-blocking */
  }

  try {
    pages = await listWebsitePages();
  } catch (err) {
    builderError = err instanceof Error ? err.message : "Builder tables not available";
  }

  const homepage = pages.find((p) => p.slug === "home");

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Site Studio"
        subtitle="Premium visual website builder — draft, preview, and publish"
      />

      {builderError ? (
        <LoadError title="Visual builder not ready" message={builderError} retryHref="/admin/website" />
      ) : (
        <>
          <div className="admin-card flex flex-wrap items-center gap-3 bg-gradient-to-br from-white to-sky/20">
            <div className="flex-1">
              <p className="font-semibold text-navy">Visual page builder</p>
              <p className="mt-1 text-sm text-charcoal/75">
                Inline editing, drag-and-drop sections, live preview, autosave drafts, and versioned publish.
              </p>
            </div>
            {homepage ? (
              <Link href={`/admin/website/builder/${homepage.id}`} className="admin-btn no-underline">
                Edit homepage
              </Link>
            ) : null}
            <Link href="/admin/website/pages" className="admin-btn-secondary no-underline">
              All pages
            </Link>
            <Link href="/admin/website/media" className="admin-btn-secondary no-underline">
              Media library
            </Link>
          </div>

          <p className="rounded-xl border border-ocean/25 bg-sky/30 px-4 py-3 text-sm leading-relaxed text-navy">
            <strong>Public homepage remains locked</strong> until you publish from the builder. Draft preview uses a secure token URL. Only published snapshots render on the live site once wired.
          </p>
        </>
      )}

      <TaskQuickAdd crew={crew} variant="primary" label="+ Add website task" className="w-full" defaults={{ category: "Website Update" }} />
      <TaskWorkflowBar context="website" defaults={{ category: "Website Update" }} />
    </div>
  );
}
