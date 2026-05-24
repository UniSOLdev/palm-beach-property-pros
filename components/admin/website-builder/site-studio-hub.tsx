import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import type { SiteStudioHealth } from "@/lib/admin/actions/site-studio-health";

type PageRow = {
  id: string;
  slug: string;
  title: string;
  page_type: string;
  status: string;
  updated_at: string;
  published_at: string | null;
  preview_token?: string;
};

export function SiteStudioHub({
  pages,
  health,
  loadError,
}: {
  pages: PageRow[];
  health: SiteStudioHealth;
  loadError: string | null;
}) {
  const homepage = pages.find((p) => p.slug === "home");

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Site Studio"
        subtitle="Premium visual website builder — draft, preview, and publish"
      />

      {loadError ? (
        <LoadError
          title="Site Studio not ready"
          message={loadError}
          retryHref="/admin/website"
        />
      ) : null}

      {!health.ready && !loadError ? (
        <div className="admin-card space-y-3 border border-amber-200 bg-amber-50/80">
          <h2 className="font-bold text-navy">Database setup required</h2>
          <p className="text-sm text-charcoal/80">
            Apply the Site Studio migration in Supabase SQL editor, then reload the schema cache.
          </p>
          <code className="block rounded-lg bg-white px-3 py-2 text-xs text-navy">
            {health.migrationFile}
          </code>
        </div>
      ) : null}

      {health.ready ? (
        <>
          <div className="admin-card overflow-hidden bg-gradient-to-br from-white via-sky/10 to-ocean/5 p-0">
            <div className="border-b border-navy/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean">Visual builder</p>
              <p className="mt-1 text-sm text-charcoal/75">
                Drag-and-drop sections, inline editing, autosave, and versioned publish.
              </p>
            </div>
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              <StudioLink
                href={homepage ? `/admin/website/builder/${homepage.id}` : "/admin/website/pages"}
                title="Edit homepage"
                description="Hero, services, gallery, testimonials, CTA"
                primary
              />
              <StudioLink
                href="/admin/website/pages"
                title="All pages"
                description="Service pages, city SEO, landing pages"
              />
              <StudioLink
                href="/admin/website/media"
                title="Media library"
                description="Upload, tag, and pick images for sections"
              />
              {homepage?.preview_token ? (
                <StudioLink
                  href={`/preview/${homepage.preview_token}`}
                  title="Preview draft"
                  description="Secure token preview in new tab"
                  external
                />
              ) : null}
            </div>
          </div>

          {pages.length > 0 ? (
            <div className="admin-card">
              <h3 className="font-semibold text-navy">Recent pages</h3>
              <ul className="mt-3 space-y-2">
                {pages.slice(0, 5).map((page) => (
                  <li key={page.id} className="flex items-center justify-between gap-2 rounded-xl bg-cream/50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">{page.title}</p>
                      <p className="text-xs text-charcoal/60">/{page.slug === "home" ? "" : page.slug}</p>
                    </div>
                    <Link href={`/admin/website/builder/${page.id}`} className="shrink-0 text-xs font-semibold text-ocean no-underline">
                      Open →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="rounded-xl border border-ocean/25 bg-sky/30 px-4 py-3 text-sm leading-relaxed text-navy">
            Public homepage stays locked until you publish from the builder. Only published snapshots render on the live site once wired.
          </p>
        </>
      ) : null}
    </div>
  );
}

function StudioLink({
  href,
  title,
  description,
  primary,
  external,
}: {
  href: string;
  title: string;
  description: string;
  primary?: boolean;
  external?: boolean;
}) {
  const className = `block rounded-xl border px-4 py-3 no-underline transition hover:shadow-card ${
    primary
      ? "border-ocean/30 bg-navy text-cream hover:bg-ocean"
      : "border-navy/10 bg-white text-navy hover:border-ocean/30"
  }`;

  const inner = (
    <>
      <p className="font-semibold">{title}</p>
      <p className={`mt-1 text-xs ${primary ? "text-cream/80" : "text-charcoal/65"}`}>{description}</p>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
