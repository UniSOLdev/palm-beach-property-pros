/**
 * Central PBPP marketing & operations CTA destinations.
 * Linkr (getlinkr.co) is intentionally not used until that integration is production-ready.
 */

export const PBPP_ROUTES = {
  home: "/",
  quote: "/quote",
  services: "/services",
  pricing: "/pricing",
  serviceArea: "/service-area",
  clientPortal: "/client-portal",
  payInvoice: "/pay-invoice",
  reviews: "/reviews",
  privacy: "/privacy",
} as const;

export type PbppRouteKey = keyof typeof PBPP_ROUTES;

/** Shared CTA copy — keep labels consistent site-wide. */
export const CTA_LABELS = {
  getFreeQuote: "Get Free Quote",
  getAFreeQuote: "Get a free quote",
  openClientPortal: "Open client portal",
  openQuickAccess: "Open quick access page",
  discussPlan: "Discuss a plan →",
  requestPricing: "Request pricing",
  bookService: "Book service",
  payInvoice: "Pay invoice",
  leaveReview: "Leave a review",
  openQuickAccessPage: "Open quick access page",
  continueToQuote: "Continue to request quote",
  footerClientTools: "Book service · Pay invoice · Leave a review",
} as const;

/**
 * Optional Google review URL (set NEXT_PUBLIC_GOOGLE_REVIEW_URL when ready).
 * The /reviews page uses this for a direct review button when configured.
 */
export const GOOGLE_REVIEW_URL =
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL : undefined)?.trim() ||
  "";

const LEGACY_LINKR_HOST = "getlinkr.co";

export function isExternalHref(href: string): boolean {
  const h = href.trim().toLowerCase();
  if (h.startsWith("tel:") || h.startsWith("mailto:")) return true;
  if (h.startsWith("http://") || h.startsWith("https://")) {
    return !h.includes(LEGACY_LINKR_HOST);
  }
  return false;
}

/** Rewrites legacy Linkr URLs to internal client portal; normalizes external flags. */
export function normalizeCtaHref(
  href: string,
  external?: boolean,
): { href: string; external: boolean } {
  const raw = href.trim();
  if (!raw) return { href: PBPP_ROUTES.quote, external: false };

  if (raw.toLowerCase().includes(LEGACY_LINKR_HOST)) {
    return { href: PBPP_ROUTES.clientPortal, external: false };
  }

  if (raw.startsWith("tel:") || raw.startsWith("mailto:")) {
    return { href: raw, external: true };
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return { href: raw, external: external ?? true };
  }

  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return { href: path, external: false };
}

export function externalLinkRel(href: string): string | undefined {
  if (!isExternalHref(href) || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return undefined;
  }
  return "noopener noreferrer";
}
