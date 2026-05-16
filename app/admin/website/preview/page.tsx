export const dynamic = "force-dynamic";

import { CmsHomepageView } from "@/components/marketing/cms-homepage-view";
import { HomeStaticPage } from "@/components/marketing/home-static-page";
import { getDraftHomepageSections, getPublishedTheme } from "@/lib/cms-queries";

export const metadata = { title: "Draft preview" };

export default async function WebsiteDraftPreviewPage() {
  const [draft, theme] = await Promise.all([getDraftHomepageSections(), getPublishedTheme()]);

  if (!draft?.length) {
    return (
      <div className="space-y-6">
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No homepage draft yet. Run <strong>Bootstrap</strong> on the Website dashboard or save a draft from the
          Homepage builder.
        </p>
        <div className="rounded-2xl border border-white/10 bg-cream p-4 text-zinc-900">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-navy/70">Static fallback</p>
          <HomeStaticPage />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-sky-300">
        Draft preview — not published. Public site still uses published content or static fallback.
      </p>
      <div className="rounded-2xl border border-white/10 bg-cream p-4 text-zinc-900">
        <CmsHomepageView sections={draft} theme={theme} />
      </div>
    </div>
  );
}
