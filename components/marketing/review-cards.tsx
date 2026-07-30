import type { CustomerReview } from "@/lib/reviews";

function Stars({ rating }: { rating: CustomerReview["starRating"] }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < rating ? "text-ocean" : "text-charcoal/20"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewCards({ reviews }: { reviews: CustomerReview[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="flex h-full flex-col rounded-2xl border border-navy/[0.08] bg-white p-6 shadow-sm"
        >
          <Stars rating={review.starRating} />
          <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-charcoal/85">
            “{review.reviewText}”
          </blockquote>
          <footer className="mt-5 border-t border-navy/[0.06] pt-4 text-sm">
            <p className="font-semibold text-navy">{review.customerName}</p>
            <p className="text-charcoal/65">
              {review.city}
              {review.service ? ` · ${review.service}` : ""}
            </p>
            {review.googleReviewUrl ? (
              <a
                href={review.googleReviewUrl}
                className="link-luxury mt-2 inline-block text-xs"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Google →
              </a>
            ) : null}
          </footer>
        </article>
      ))}
    </div>
  );
}
