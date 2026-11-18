export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.palmbeachpropertypros.com";
export const SITE_NAME = "Palm Beach Property Pros";
export const TAGLINE = "Your home, quietly cared for.";

export const SITE_DESCRIPTION =
  "Discreet home watch, arrival and departure prep, hurricane preparation, and household services for seasonal residents in Palm Beach Gardens, Jupiter, North Palm Beach, and Palm Beach. Call for a private quote.";

export const PHONE_DISPLAY = "561-629-2617";
export const PHONE_TEL = "tel:15616292617";
export const SMS_TEL = "sms:15616292617";

/** Primary public client flows — all on PBPP domain. */
export const QUOTE_PATH = "/quote" as const;
export const INVOICE_PATH_PREFIX = "/i" as const;

export const SERVICE_CITIES = [
  "Palm Beach Gardens",
  "Jupiter",
  "North Palm Beach",
  "Palm Beach",
  "and nearby communities by request",
] as const;
