import { hasPublishedReviews } from "@/lib/reviews";

/**
 * Reviews section — hidden until real Google reviews are supplied.
 * Set `showComingSoon` to true to display a neutral placeholder.
 */
export function ReviewsSection({ showComingSoon = false }: { showComingSoon?: boolean }) {
  if (!hasPublishedReviews() && !showComingSoon) {
    return null;
  }

  if (!hasPublishedReviews()) {
    return (
      <section className="py-12 md:py-16" aria-label="Customer reviews">
        <div className="mx-auto max-w-2xl rounded-2xl border border-navy/[0.08] bg-sand/30 px-6 py-10 text-center">
          <p className="section-eyebrow text-ocean">Customer reviews</p>
          <p className="mt-3 text-base text-charcoal/75">Customer reviews coming soon.</p>
        </div>
      </section>
    );
  }

  // Future: render review cards from getPublishedReviews()
  return null;
}
