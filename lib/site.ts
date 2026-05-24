export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.palmbeachpropertypros.com";
export const SITE_NAME = "Palm Beach Property Pros";
export const TAGLINE =
  "One reliable local team for everything your property needs.";

export const PHONE_DISPLAY = "561-629-2617";
export const PHONE_TEL = "tel:15616292617";
export const SMS_TEL = "sms:15616292617";

/** Primary public client flows — all on PBPP domain. */
export const QUOTE_PATH = "/quote" as const;
export const INVOICE_PATH_PREFIX = "/i" as const;

export const SERVICE_CITIES = [
  "West Palm Beach",
  "Palm Beach Gardens",
  "Jupiter",
  "Riviera Beach",
  "Lake Worth",
  "Boynton Beach",
  "Delray Beach",
  "North Palm Beach",
  "Juno Beach",
  "and nearby Palm Beach County areas",
] as const;
