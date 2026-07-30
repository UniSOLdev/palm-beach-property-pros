/**
 * Lightweight analytics helpers. Events are sent to `window.gtag` when present
 * (e.g. after the owner adds Google Analytics). Safe no-op otherwise.
 *
 * Event catalog:
 * | Event name              | When it fires                          |
 * |-------------------------|----------------------------------------|
 * | estimate_form_submit    | Quote form submitted successfully      |
 * | phone_click             | tel: link clicked                      |
 * | sms_click               | sms: link clicked                      |
 * | email_click             | mailto: link clicked                   |
 * | service_card_click      | Homepage/service card link clicked     |
 * | mobile_detailing_click  | Mobile detailing page or CTA clicked   |
 * | residential_inquiry     | Residential path CTA clicked           |
 * | commercial_inquiry      | Commercial path CTA clicked            |
 */

export type AnalyticsEvent =
  | "estimate_form_submit"
  | "phone_click"
  | "sms_click"
  | "email_click"
  | "service_card_click"
  | "mobile_detailing_click"
  | "residential_inquiry"
  | "commercial_inquiry";

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackEvent(event: AnalyticsEvent, params?: EventParams): void {
  if (typeof window === "undefined") return;

  const payload = { event, ...params };

  if (typeof window.gtag === "function") {
    window.gtag("event", event, params ?? {});
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[PBPP analytics]", payload);
  }
}

export function trackPhoneClick(location: string): void {
  trackEvent("phone_click", { location });
}

export function trackSmsClick(location: string): void {
  trackEvent("sms_click", { location });
}

export function trackEmailClick(location: string): void {
  trackEvent("email_click", { location });
}

export function trackServiceCardClick(service: string, location: string): void {
  trackEvent("service_card_click", { service, location });
}
