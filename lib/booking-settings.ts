import type { BusinessSettings, PreferredBookingMethod } from "@/lib/admin/types";

const PREFS: PreferredBookingMethod[] = ["Square", "Quote Form", "Phone/Text", "Manual"];

export function normalizePreferredBookingMethod(raw: string | null | undefined): PreferredBookingMethod {
  const s = String(raw ?? "").trim() as PreferredBookingMethod;
  return PREFS.includes(s) ? s : "Quote Form";
}

/** Primary booking/scheduling link for marketing CTAs. */
export function resolveBookingHref(settings: BusinessSettings): string {
  const square = settings.squareBookingUrl?.trim();
  if (square) return square;
  const pref = normalizePreferredBookingMethod(settings.preferredBookingMethod);
  if (pref === "Phone/Text") {
    const digits = settings.phone.replace(/\D/g, "");
    if (digits.length === 10) return `tel:+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
    if (digits.length >= 10) return `tel:+${digits}`;
  }
  return "/quote";
}

export function resolveBookingLabel(settings: BusinessSettings): string {
  const t = settings.bookingCtaText?.trim();
  if (t) return t;
  const pref = normalizePreferredBookingMethod(settings.preferredBookingMethod);
  if (pref === "Square") return "Book online";
  if (pref === "Phone/Text") return "Call or text";
  return "Get a quote";
}

export function resolvePaymentCtaLabel(settings: BusinessSettings): string {
  return settings.paymentCtaText?.trim() || "Payment options";
}

/** Plain text for Zelle + deposit lines (clipboard / public pages). */
export function buildDepositInstructionText(settings: BusinessSettings): string {
  const parts: string[] = [];
  if (settings.depositInstructions?.trim()) parts.push(settings.depositInstructions.trim());
  const z: string[] = [];
  if (settings.zelleDisplayName?.trim()) z.push(`Pay to: ${settings.zelleDisplayName.trim()}`);
  if (settings.zelleEmail?.trim()) z.push(`Zelle email: ${settings.zelleEmail.trim()}`);
  if (settings.zellePhone?.trim()) z.push(`Zelle phone: ${settings.zellePhone.trim()}`);
  if (z.length) parts.push(z.join("\n"));
  if (settings.bookingPaymentMethods?.length) {
    parts.push(`Accepted: ${settings.bookingPaymentMethods.join(", ")}`);
  }
  return parts.join("\n\n").trim();
}

/** Invoice / balance payment: Square link first line, then Zelle + notes. */
export function buildInvoicePaymentInstructionText(settings: BusinessSettings): string {
  const parts: string[] = [];
  const sq = settings.squareInvoiceUrl?.trim();
  if (sq) parts.push(`Pay online: ${sq}`);
  const dep = buildDepositInstructionText(settings);
  if (dep) parts.push(dep);
  const payCta = settings.paymentCtaText?.trim();
  if (payCta) parts.push(payCta);
  return parts.filter(Boolean).join("\n\n").trim();
}
