export const dynamic = "force-dynamic";

import Link from "next/link";

import { CmsBootstrapButton } from "@/components/admin/cms-bootstrap-button";
import { loadCmsAdminSummary } from "@/lib/cms-admin-summary";

export const metadata = {
  title: "Website manager",
};

export default async function WebsiteDashboardPage() {
  let stats: Awaited<ReturnType<typeof loadCmsAdminSummary>> | null = null;
  let err: string | null = null;
  try {
    stats = await loadCmsAdminSummary();
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not load CMS summary.";
  }

  return (
    <div className="space-y-10">
      {err ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {err}{" "}
          <span className="text-amber-200/80">
            Run the Supabase migration `20250522000000_cms_website.sql` and ensure service role env vars are set.
          </span>
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Media assets" value={stats?.media ?? "—"} />
        <Stat label="Gallery items" value={stats?.gallery ?? "—"} />
        <Stat label="Reviews" value={stats?.reviews ?? "—"} />
        <Stat label="Published projects" value={stats?.projects ?? "—"} />
        <Stat label="Service areas" value={stats?.service_areas ?? "—"} />
        <Stat label="CTAs" value={stats?.ctas ?? "—"} />
        <Stat label="Service overrides" value={stats?.service_overrides ?? "—"} />
        <Stat label="Homepage completion" value={stats ? `${stats.homepage_completion}%` : "—"} />
        <Stat label="SEO map signal" value={stats ? `${stats.seo_completion}%` : "—"} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Quick href="/admin/website/media">Upload media</Quick>
          <Quick href="/admin/website/homepage">Edit homepage</Quick>
          <Quick href="/admin/website/preview" target="_blank">
            Preview draft
          </Quick>
          <Quick href="/admin/website/gallery">Gallery</Quick>
          <Quick href="/admin/website/reviews">Reviews</Quick>
          <Quick href="/admin/website/projects">Projects</Quick>
          <Quick href="/admin/website/service-areas">Service areas</Quick>
          <Quick href="/admin/website/services">Services</Quick>
          <Quick href="/admin/website/ctas">CTAs</Quick>
          <Quick href="/admin/website/navigation">Navigation</Quick>
          <Quick href="/admin/website/seo">SEO</Quick>
          <Quick href="/admin/website/theme">Theme</Quick>
        </div>
        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="max-w-3xl text-xs text-zinc-500">
            Bootstrap copies the <strong className="text-zinc-300">current live marketing copy</strong> into CMS drafts
            (homepage, navigation shell, SEO map). It does <strong className="text-zinc-300">not</strong> publish the
            homepage unless you confirm live publish in the dialog.
          </p>
          <div className="mt-4">
            <CmsBootstrapButton />
          </div>
        </div>
      </section>

      <section className="grid gap-4 text-xs text-zinc-500 sm:grid-cols-2">
        <p>Last homepage update: {stats?.last_homepage_update ?? "—"}</p>
        <p>Last homepage publish: {stats?.last_homepage_publish ?? "—"}</p>
        <p>Last SEO update: {stats?.last_seo_update ?? "—"}</p>
        <p>Last shell publish: {stats?.last_shell_publish ?? "—"}</p>
        <p>Last theme publish: {stats?.last_theme_publish ?? "—"}</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 ring-1 ring-white/[0.04]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function Quick({ href, children, target }: { href: string; children: React.ReactNode; target?: string }) {
  return (
    <Link
      href={href}
      target={target}
      className="rounded-xl border border-white/10 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-100 no-underline transition hover:border-sky-400/40"
    >
      {children}
    </Link>
  );
}
