import { ReviewCards } from "@/components/marketing/review-cards";
import { getPublishedReviews, hasPublishedReviews } from "@/lib/reviews";

/**
 * Reviews section — hidden until real Google reviews are added in lib/reviews.ts.
 */
export function ReviewsSection() {
  const reviews = getPublishedReviews();

  if (!hasPublishedReviews()) {
    return null;
  }

  return (
    <section className="py-16 md:py-24" aria-labelledby="reviews-heading">
      <div className="mx-auto max-w-2xl text-center">
        <p className="section-eyebrow text-ocean">Customer reviews</p>
        <h2 id="reviews-heading" className="section-title mt-4">
          What Palm Beach County clients say
        </h2>
        <p className="section-lead">
          Real feedback from homeowners, property managers, and local businesses we have served.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-6xl">
        <ReviewCards reviews={reviews} />
      </div>
    </section>
  );
}
