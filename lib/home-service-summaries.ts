import type { ServiceSlug } from "@/lib/services";

/**
 * Homepage card blurbs only — keeps full `shortDescription` on service detail pages for SEO.
 */
export const HOME_SERVICE_SUMMARY: Record<ServiceSlug, string> = {
  "window-cleaning":
    "Crystal-clear glass inside and out. Screens and frames handled with care.",
  "pressure-washing":
    "Exterior renewal with pressure or soft washing matched to each substrate.",
  "auto-detailing":
    "Interior freshness and exterior depth—trim, wheels, and cabin materials protected.",
  "residential-cleaning":
    "A calmer, consistently kept home—priority rooms and finishes on your schedule.",
  "commercial-cleaning":
    "Customer-ready floors, glass, and touchpoints aligned to your operating hours.",
  "carpet-steam-cleaning":
    "Hot-water extraction that lifts embedded soil with clear dry-time guidance.",
  "trash-can-cleaning":
    "Deodorized, sanitized bins—fresher garages and less odor carry into the home.",
  "property-maintenance":
    "Scoped punch-list and touch-ups so rentals and second homes stay guest-ready.",
  "airbnb-services":
    "Turnover-ready cleans and staging touches aligned to check-in windows.",
};
