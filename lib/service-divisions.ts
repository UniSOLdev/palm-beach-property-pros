import type { ServiceSlug } from "@/lib/services";

export type DivisionService = {
  label: string;
  slug: ServiceSlug;
};

export type ServiceDivision = {
  id: string;
  title: string;
  subtitle: string;
  services: DivisionService[];
};

/** Operational groupings for marketing — routes stay on existing service slugs. */
export const SERVICE_DIVISIONS: ServiceDivision[] = [
  {
    id: "exterior-care",
    title: "Exterior care",
    subtitle: "Curb presence, glass clarity, and exterior surfaces maintained to coastal standards.",
    services: [
      { label: "Window cleaning", slug: "window-cleaning" },
      { label: "Pressure washing", slug: "pressure-washing" },
      { label: "Exterior detailing", slug: "auto-detailing" },
    ],
  },
  {
    id: "interior-care",
    title: "Interior care",
    subtitle: "Residences and interiors kept inspection-ready with repeatable crew standards.",
    services: [
      { label: "Residential cleaning", slug: "residential-cleaning" },
      { label: "Carpet cleaning", slug: "carpet-steam-cleaning" },
      { label: "Move-out cleaning", slug: "residential-cleaning" },
    ],
  },
  {
    id: "property-support",
    title: "Property support",
    subtitle: "Turnovers, light maintenance, and onsite support aligned with operations calendars.",
    services: [
      { label: "Airbnb turnovers", slug: "airbnb-services" },
      { label: "Property maintenance", slug: "property-maintenance" },
      { label: "Trash services", slug: "trash-can-cleaning" },
    ],
  },
];

export type PropertyCarePlan = {
  name: string;
  description: string;
  cadence: string;
};

export const PROPERTY_CARE_PLANS: PropertyCarePlan[] = [
  {
    name: "Weekly care",
    description: "High-touch homes and active storefronts that need a steady baseline year-round.",
    cadence: "Weekly rhythm",
  },
  {
    name: "Seasonal property plans",
    description: "Open, close, and peak-season refreshes for coastal estates and second homes.",
    cadence: "Seasonal playbook",
  },
  {
    name: "Vacation home care",
    description: "Coordinated visits while you are away—glass, exterior, and interior touchpoints.",
    cadence: "Owner-offsite coverage",
  },
  {
    name: "Airbnb turnover programs",
    description: "Check-in aligned crews, linen resets, and staging details under your SOPs.",
    cadence: "Per turnover",
  },
  {
    name: "Storefront maintenance plans",
    description: "Glass, floors, and high-traffic zones matched to operating hours and traffic.",
    cadence: "Commercial cadence",
  },
];
