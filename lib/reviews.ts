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
export const CUSTOMER_REVIEWS: CustomerReview[] = [];

export function getPublishedReviews(): CustomerReview[] {
  return CUSTOMER_REVIEWS.filter((r) => r.published);
}

export function hasPublishedReviews(): boolean {
  return getPublishedReviews().length > 0;
}
