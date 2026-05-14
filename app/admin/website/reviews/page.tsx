import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { archiveWebsiteReviewAction } from "@/lib/admin/actions";
import { listWebsiteReviewsAdmin } from "@/lib/admin/website-queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function WebsiteReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; archived?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const useDb = isSupabaseServerConfigured();
  const rows = await listWebsiteReviewsAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        actions={
          <Link href="/admin/website/reviews/new" className="btn-primary no-underline">
            Add review
          </Link>
        }
      />
      {(sp.err || sp.saved || sp.archived) && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            sp.err ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {sp.err ?? (sp.archived ? "Archived." : "Saved.")}
        </div>
      )}
      <Card>
        <ul className="divide-y divide-navy/10">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-semibold text-navy">
                  {r.customerName} · {r.rating}★
                </div>
                <p className="mt-1 max-w-2xl text-sm text-charcoal/85">{r.reviewText}</p>
                <div className="mt-1 text-xs text-charcoal/55">
                  {[r.serviceType, r.city, r.source].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {r.featured ? (
                  <span className="self-start rounded-full bg-gold/25 px-2 py-0.5 text-[11px] font-bold text-navy">Featured</span>
                ) : null}
                {useDb ? (
                  <form action={archiveWebsiteReviewAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="text-xs font-semibold text-rose-700 underline">
                      Archive
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-charcoal/50">Live DB required</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {rows.length === 0 ? <p className="text-sm text-charcoal/60">No reviews yet.</p> : null}
      </Card>
    </div>
  );
}
