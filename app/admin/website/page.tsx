import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";
import {
  listWebsiteGalleryItemsAdmin,
  listWebsiteProjectsAdmin,
  listWebsiteReviewsAdmin,
} from "@/lib/admin/website-queries";

const cards = [
  { href: "/admin/website/gallery", title: "Manage gallery", body: "Before/after and showcase photos (URLs for now)." },
  { href: "/admin/website/projects", title: "Featured projects", body: "Structured before/after stories for the site." },
  { href: "/admin/website/reviews", title: "Reviews", body: "Testimonials with source, rating, and service tags." },
  { href: "/admin/website/homepage", title: "Homepage copy", body: "Hero lines, CTAs, and trust badges." },
  { href: "/admin/website/services", title: "Services", body: "Optional override list for marketing pages." },
  { href: "/admin/website/service-areas", title: "Service areas", body: "City/area blurbs and featured flags." },
  { href: "/admin/website/media", title: "Media library", body: "Reusable image URLs and tags." },
] as const;

export default async function WebsiteManagerPage() {
  const useDb = isSupabaseServerConfigured();
  const [gallery, reviews, projects] = await Promise.all([
    listWebsiteGalleryItemsAdmin(),
    listWebsiteReviewsAdmin(),
    listWebsiteProjectsAdmin(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Website manager"
        subtitle="Update the public PBPP site without touching code. Run Supabase migration 006 for live tables; demo mode still shows curated previews on the homepage."
      />

      {!useDb ? (
        <div className="mb-6 rounded-2xl border border-ocean/20 bg-ice px-4 py-3 text-sm text-navy">
          <span className="font-semibold">Demo previews active.</span> Connect Supabase and run{" "}
          <code className="rounded bg-white/80 px-1">006_website_content.sql</code> to persist gallery, reviews, and homepage rows.
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card title="Gallery items">{gallery.length}</Card>
        <Card title="Reviews">{reviews.length}</Card>
        <Card title="Projects">{projects.length}</Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="no-underline">
            <Card className="h-full transition hover:border-coast/40 hover:shadow-lift">
              <h2 className="text-base font-bold text-navy">{c.title}</h2>
              <p className="mt-2 text-sm text-charcoal/75">{c.body}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-ocean">Open →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
