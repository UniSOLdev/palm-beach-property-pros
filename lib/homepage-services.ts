import { getSiteImageAsset, SERVICE_STOCK_IMAGE_IDS } from "@/lib/media/site-imagery";
import type { MediaAsset } from "@/lib/media/types";

export type HomeServiceCard = {
  title: string;
  description: string;
  href: string;
  slug: string;
  /** Stock/decorative image — never real-project on service cards */
  asset: MediaAsset;
  secondary?: boolean;
};

function stockAssetForSlug(slug: string, fallbackId: string): MediaAsset {
  const imageId = SERVICE_STOCK_IMAGE_IDS[slug] ?? fallbackId;
  return getSiteImageAsset(imageId)!;
}

/** Six primary homepage service cards — cleaning and property care lead; detailing is secondary. */
export const HOME_SERVICE_CARDS: HomeServiceCard[] = [
  {
    title: "Window Cleaning",
    description:
      "Clear glass inside and out—frames, screens, and coastal residue handled with care.",
    href: "/window-cleaning",
    slug: "window-cleaning",
    asset: stockAssetForSlug("window-cleaning", "service-window-cleaning"),
  },
  {
    title: "Pressure Washing & Soft Washing",
    description:
      "Driveways, patios, siding, and pool decks cleaned with the right pressure for each surface.",
    href: "/pressure-washing",
    slug: "pressure-washing",
    asset: stockAssetForSlug("pressure-washing", "service-pressure-washing"),
  },
  {
    title: "Residential Cleaning",
    description:
      "Recurring home cleaning, deep cleans, and move-in or move-out service on a schedule that fits.",
    href: "/residential-cleaning",
    slug: "residential-cleaning",
    asset: stockAssetForSlug("residential-cleaning", "service-residential-cleaning"),
  },
  {
    title: "Commercial Cleaning",
    description:
      "Customer-ready floors, restrooms, and glass—aligned to your hours and foot traffic.",
    href: "/commercial-cleaning",
    slug: "commercial-cleaning",
    asset: stockAssetForSlug("commercial-cleaning", "service-commercial-cleaning"),
  },
  {
    title: "Property & Estate Care",
    description:
      "Estate upkeep, property cleanups, and dependable coordination for seasonal and second homes.",
    href: "/property-care",
    slug: "property-care",
    asset: stockAssetForSlug("property-care", "service-property-care"),
  },
  {
    title: "Mobile Detailing",
    description:
      "Interior, exterior, and full details at your home or workplace—SUVs, trucks, and daily drivers.",
    href: "/mobile-detailing",
    slug: "mobile-detailing",
    asset: stockAssetForSlug("mobile-detailing", "service-mobile-detailing"),
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

export const RECURRING_CARE_PROGRAMS = [
  {
    title: "Weekly home cleaning",
    body: "Keep kitchens, baths, and priority rooms on a steady schedule year-round.",
  },
  {
    title: "Seasonal estate programs",
    body: "Open, close, and peak-season cleaning for coastal and second homes.",
  },
  {
    title: "Vacation-home checks",
    body: "Scheduled visits while you are away—interior walkthroughs and exterior checks.",
  },
  {
    title: "Rental turnovers",
    body: "Check-in aligned cleaning and staging for Airbnb and short-term rentals.",
  },
] as const;
