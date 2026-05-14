import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { saveWebsiteHomepageAction } from "@/lib/admin/actions";
import { getWebsiteHomepageRow } from "@/lib/admin/website-queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

const DEFAULT_HEADLINE =
  "Premium local property care — cleaning, detailing, pressure washing, windows, turnovers & maintenance.";

export default async function WebsiteHomepagePage({ searchParams }: { searchParams: Promise<{ err?: string; saved?: string }> }) {
  const sp = await searchParams;
  const useDb = isSupabaseServerConfigured();
  const row = useDb ? await getWebsiteHomepageRow() : null;

  return (
    <div>
      <AdminPageHeader title="Homepage content" subtitle="Hero and trust copy feed the public homepage when Supabase has a row saved." />
      {(sp.err || sp.saved) && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            sp.err ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {sp.err ?? "Saved."}
        </div>
      )}
      <Card>
        {useDb ? (
          <form action={saveWebsiteHomepageAction} className="grid gap-4 md:grid-cols-2">
            {row?.id ? <input type="hidden" name="id" value={row.id} /> : null}
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Hero eyebrow</span>
              <input name="hero_eyebrow" defaultValue={row?.heroEyebrow ?? "Palm Beach County"} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Hero headline</span>
              <input name="hero_headline" defaultValue={row?.heroHeadline ?? DEFAULT_HEADLINE} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Hero subheadline</span>
              <textarea name="hero_subheadline" rows={3} defaultValue={row?.heroSubheadline ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Primary CTA text</span>
              <input name="primary_cta_text" defaultValue={row?.primaryCtaText ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Primary CTA link</span>
              <input name="primary_cta_link" defaultValue={row?.primaryCtaLink ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" placeholder="/quote or https://…" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Secondary CTA text</span>
              <input name="secondary_cta_text" defaultValue={row?.secondaryCtaText ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Secondary CTA link</span>
              <input name="secondary_cta_link" defaultValue={row?.secondaryCtaLink ?? ""} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Trust badges (one per line or comma-separated)</span>
              <textarea
                name="trust_badges"
                rows={4}
                defaultValue={(row?.trustBadges?.length ? row.trustBadges : ["Palm Beach County", "Residential & commercial", "Photo-based estimates", "Move-out & Airbnb specialists"]).join("\n")}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
              />
            </label>
            <button type="submit" className="btn-primary md:col-span-2">
              Save homepage
            </button>
          </form>
        ) : (
          <p className="text-sm text-charcoal/70">Configure Supabase to edit homepage content.</p>
        )}
      </Card>
      <p className="mt-4 text-xs text-charcoal/55">
        Booking buttons on the live site still follow{" "}
        <Link href="/admin/settings#booking-payments" className="font-semibold text-ocean no-underline">
          Settings → Booking &amp; payments
        </Link>
        .
      </p>
    </div>
  );
}
