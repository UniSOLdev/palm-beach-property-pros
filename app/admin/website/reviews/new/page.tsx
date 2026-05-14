import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { SERVICE_TYPES } from "@/lib/admin/constants";
import { createWebsiteReviewAction } from "@/lib/admin/actions";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

const SOURCES = ["Google", "Facebook", "Direct", "Text", "Other"] as const;

export default async function NewWebsiteReviewPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  const useDb = isSupabaseServerConfigured();

  return (
    <div>
      <AdminPageHeader
        title="Add review"
        actions={
          <Link href="/admin/website/reviews" className="btn-secondary no-underline">
            Back
          </Link>
        }
      />
      {sp.err ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{sp.err}</div>
      ) : null}
      <Card>
        {useDb ? (
          <form action={createWebsiteReviewAction} className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Customer name</span>
              <input name="customer_name" required className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Rating (1–5)</span>
              <input type="number" name="rating" min={1} max={5} defaultValue={5} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Review text</span>
              <textarea name="review_text" rows={4} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
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
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">City</span>
              <input name="city" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Source</span>
              <select name="source" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2">
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Sort order</span>
              <input type="number" name="sort_order" defaultValue={0} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="featured" className="h-4 w-4 rounded border-navy/25" defaultChecked />
              <span className="text-sm text-charcoal/80">Featured on homepage</span>
            </label>
            <button type="submit" className="btn-primary md:col-span-2">
              Save review
            </button>
          </form>
        ) : (
          <p className="text-sm text-charcoal/70">Configure Supabase to add reviews.</p>
        )}
      </Card>
    </div>
  );
}
