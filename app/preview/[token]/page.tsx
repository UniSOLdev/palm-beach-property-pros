import { notFound } from "next/navigation";
import { PagePreview } from "@/components/cms/sections/section-renderer";
import { getPreviewPageByToken } from "@/lib/admin/actions/website-builder";
import type { WebsiteSectionRow } from "@/lib/cms/section-registry";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPreviewPageByToken(token);
  if (!data) notFound();

  const sections = (data.sections as WebsiteSectionRow[]).filter((s) => s.is_visible);

  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-navy/10 bg-navy px-4 py-2 text-center text-xs text-cream/90">
        Draft preview — {(data.page as { title?: string }).title ?? "Page"} · not published
      </div>
      <main className="mx-auto max-w-6xl">
        <PagePreview sections={sections} theme={data.theme as Record<string, unknown>} />
      </main>
    </div>
  );
}
