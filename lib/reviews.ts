/**
 * Customer review data for the public site.
 * Do not add fabricated reviews — populate from owner-supplied Google reviews.
 */

export type CustomerReview = {
  id: string;
  customerName: string;
  city: string;
  service: string;
  reviewText: string;
  starRating: 1 | 2 | 3 | 4 | 5;
  /** ISO date string */
  reviewDate: string;
  googleReviewUrl?: string;
  published: boolean;
};

/** Owner-provided reviews go here. Empty until real reviews are supplied. */
export const CUSTOMER_REVIEWS: CustomerReview[] = [
  /*
  Example — copy, paste, and set published: true when ready:
  {
    id: "review-001",
    customerName: "First name + last initial",
    city: "West Palm Beach",
    service: "Window Cleaning",
    reviewText: "Paste the exact Google review text here.",
    starRating: 5,
    reviewDate: "2026-01-15",
    googleReviewUrl: "https://g.page/r/...",
    published: true,
  },
  */
];

export function getPublishedReviews(): CustomerReview[] {
  return CUSTOMER_REVIEWS.filter((r) => r.published);
}

export function hasPublishedReviews(): boolean {
  return getPublishedReviews().length > 0;
}
