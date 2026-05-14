import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { SERVICE_TYPES } from "@/lib/admin/constants";
import { createWebsiteGalleryItemAction } from "@/lib/admin/actions";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function NewWebsiteGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const sp = await searchParams;
  const useDb = isSupabaseServerConfigured();

  return (
    <div>
      <AdminPageHeader
        title="Add gallery item"
        actions={
          <Link href="/admin/website/gallery" className="btn-secondary no-underline">
            Back
          </Link>
        }
      />
      {sp.err ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{sp.err}</div>
      ) : null}
      <Card>
        {useDb ? (
          <form action={createWebsiteGalleryItemAction} className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Image URL</span>
              <input name="image_url" required className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" placeholder="https://…" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Before image URL</span>
              <input name="before_image_url" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">After image URL</span>
              <input name="after_image_url" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Caption</span>
              <input name="caption" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Service type</span>
              <select name="service_type" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2">
                <option value="">—</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">City / location</span>
              <input name="location" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Job / client label (optional)</span>
              <input name="job_name" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Sort order</span>
              <input type="number" name="sort_order" defaultValue={0} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="featured" className="h-4 w-4 rounded border-navy/25" />
              <span className="text-sm text-charcoal/80">Featured (homepage)</span>
            </label>
            <button type="submit" className="btn-primary md:col-span-2">
              Save
            </button>
          </form>
        ) : (
          <p className="text-sm text-charcoal/70">Configure Supabase to add gallery items.</p>
        )}
      </Card>
    </div>
  );
}
