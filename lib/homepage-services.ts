import { MEDIA_REGISTRY } from "@/lib/media";
import type { MediaAsset } from "@/lib/media/types";

export type HomeServiceCard = {
  title: string;
  description: string;
  href: string;
  slug: string;
  /** Fallback image when no authentic media is mapped */
  asset: MediaAsset;
  secondary?: boolean;
};

/** Six primary homepage service cards — cleaning and property care lead; detailing is secondary. */
export const HOME_SERVICE_CARDS: HomeServiceCard[] = [
  {
    title: "Window Cleaning",
    description:
      "Clear glass inside and out—frames, screens, and coastal residue handled with care.",
    href: "/window-cleaning",
    slug: "window-cleaning",
    asset: MEDIA_REGISTRY.divisions.exterior,
  },
  {
    title: "Pressure Washing & Soft Washing",
    description:
      "Driveways, patios, siding, and pool decks cleaned with the right pressure for each surface.",
    href: "/pressure-washing",
    slug: "pressure-washing",
    asset: MEDIA_REGISTRY.operations.poolDeck,
  },
  {
    title: "Residential Cleaning",
    description:
      "Recurring home cleaning, deep cleans, and move-in or move-out service on a schedule that fits.",
    href: "/residential-cleaning",
    slug: "residential-cleaning",
    asset: MEDIA_REGISTRY.divisions.interior,
  },
  {
    title: "Commercial Cleaning",
    description:
      "Customer-ready floors, restrooms, and glass—aligned to your hours and foot traffic.",
    href: "/commercial-cleaning",
    slug: "commercial-cleaning",
    asset: MEDIA_REGISTRY.divisions.propertySupport,
  },
  {
    title: "Property & Estate Care",
    description:
      "Estate upkeep, property cleanups, and dependable coordination for seasonal and second homes.",
    href: "/property-care",
    slug: "property-care",
    asset: MEDIA_REGISTRY.audience,
  },
  {
    title: "Mobile Detailing",
    description:
      "Interior, exterior, and full details at your home or workplace—SUVs, trucks, and daily drivers.",
    href: "/mobile-detailing",
    slug: "mobile-detailing",
    asset: MEDIA_REGISTRY.divisions.exterior,
    secondary: true,
  },
];

export const TRUST_BAR_ITEMS = [
  "Locally operated",
  "Residential & commercial service",
  "Photo estimates available",
  "Before-and-after documentation",
  "Serving Palm Beach County",
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: "1",
    title: "Request an estimate",
    body: "Share photos, your city, and what you need through our online form or by phone.",
  },
  {
    step: "2",
    title: "Review scope & pricing",
    body: "We confirm access, timing, and a clear price before anything is scheduled.",
  },
  {
    step: "3",
    title: "Service day",
    body: "Our crew arrives prepared and follows the agreed checklist for your property.",
  },
  {
    step: "4",
    title: "Walkthrough & photos",
    body: "We verify results with you and share before-and-after photos when helpful.",
  },
] as const;
