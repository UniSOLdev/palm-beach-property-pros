import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { archiveWebsiteGalleryItemAction } from "@/lib/admin/actions";
import { listWebsiteGalleryItemsAdmin } from "@/lib/admin/website-queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function WebsiteGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; archived?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const useDb = isSupabaseServerConfigured();
  const rows = await listWebsiteGalleryItemsAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Gallery"
        subtitle="Featured items appear on the homepage preview strip when marked featured."
        actions={
          <Link href="/admin/website/gallery/new" className="btn-primary no-underline">
            Add gallery item
          </Link>
        }
      />

      {(sp.err || sp.saved || sp.archived) && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            sp.err ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {sp.err ?? (sp.archived ? "Item archived." : "Saved.")}
        </div>
      )}

      <Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-2xl border border-navy/10 bg-ice/40">
              <div className="relative aspect-[4/3] overflow-hidden bg-navy/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt={g.caption ?? "Gallery"} className="h-full w-full object-cover" />
              </div>
              <div className="p-4 text-sm">
                <div className="font-semibold text-navy">{g.caption ?? "Untitled"}</div>
                <div className="mt-1 text-xs text-charcoal/65">
                  {[g.serviceType, g.location].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.featured ? (
                    <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[11px] font-bold text-navy">Featured</span>
                  ) : null}
                  {useDb ? (
                    <form action={archiveWebsiteGalleryItemAction}>
                      <input type="hidden" name="id" value={g.id} />
                      <button type="submit" className="text-xs font-semibold text-rose-700 underline">
                        Archive
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-charcoal/50">Live DB required to archive</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {rows.length === 0 ? <p className="mt-4 text-sm text-charcoal/60">No gallery items yet.</p> : null}
      </Card>
    </div>
  );
}
