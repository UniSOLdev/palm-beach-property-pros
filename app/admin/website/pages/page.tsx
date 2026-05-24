import Link from "next/link";
import { CreatePageForm } from "@/components/admin/website-builder/create-page-form";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { listWebsitePages } from "@/lib/admin/actions/website-builder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website Pages" };

export default async function WebsitePagesPage() {
  let pages: Awaited<ReturnType<typeof listWebsitePages>> = [];
  let error = "";

  try {
    pages = await listWebsitePages();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load pages";
  }

  if (error) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Website pages" subtitle="Visual builder pages" />
        <LoadError title="Builder not ready" message={error} retryHref="/admin/website/pages" />
        <p className="text-sm text-charcoal/70">
          Run the website builder migration if tables are missing:{" "}
          <code className="text-xs">20260525120000_website_builder.sql</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Website pages" subtitle="Homepage, service pages, city SEO, and landing pages" />
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/website" className="admin-btn-secondary no-underline text-sm">
          Site Studio
        </Link>
        <Link href="/admin/website/media" className="admin-btn-secondary no-underline text-sm">
          Media library
        </Link>
        <CreatePageForm />
      </div>
      <ul className="space-y-3">
        {pages.map((page) => (
          <li key={page.id} className="admin-card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-navy">{page.title}</p>
              <p className="text-sm text-charcoal/70">
                /{page.slug === "home" ? "" : page.slug} · {page.page_type}
              </p>
              <span
                className={`admin-chip mt-2 ${page.status === "published" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}
              >
                {page.status}
              </span>
            </div>
            <Link href={`/admin/website/builder/${page.id}`} className="admin-btn no-underline text-sm">
              Open builder
            </Link>
          </li>
        ))}
      </ul>
      {pages.length === 0 ? (
        <p className="admin-card text-sm text-charcoal/60">No pages yet. The homepage seeds automatically after migration.</p>
      ) : null}
    </div>
  );
}
