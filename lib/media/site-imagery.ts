/**
 * Site imagery inventory — single source of truth for marketing images.
 *
 * RULE (do not violate in components):
 * - imageType `real-project` → only in "Our Work", before/after, project results, case studies
 * - imageType `stock` | `generated` | `decorative` → service cards, hero, paths, section backgrounds
 *
 * Replace entries here when PBPP supplies authentic photography.
 */

import type { MediaAsset, SiteImageType } from "@/lib/media/types";

export type SiteImageEntry = {
  id: string;
  service: string;
  /** Path under /public */
  filePath: string;
  alt: string;
  imageType: SiteImageType;
  source: string;
  licenseNotes: string;
  /** Where this image is used on the site */
  usage: string[];
  width: number;
  height: number;
  focal?: string;
  aspect?: MediaAsset["aspect"];
  overlay?: MediaAsset["overlay"];
  /** Priority for replacing with real PBPP photography */
  replacementPriority: "high" | "medium" | "low";
  replacementNote: string;
};

const STOCK_BASE = "/media/stock";
const UNSPLASH = "Unsplash (https://unsplash.com/license) — free commercial use";

export const SITE_IMAGERY: SiteImageEntry[] = [
  {
    id: "hero-home-exterior",
    service: "Homepage hero",
    filePath: `${STOCK_BASE}/hero/home-exterior.webp`,
    alt: "Bright modern South Florida home exterior with clean driveway and landscaping",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-and-brown-concrete-building-under-blue-sky-during-daytime-ba8f99d2cdde",
    licenseNotes: UNSPLASH,
    usage: ["Homepage hero background"],
    width: 2200,
    height: 1238,
    focal: "object-[62%_42%] md:object-[72%_38%]",
    aspect: "hero",
    overlay: "cinematic",
    replacementPriority: "high",
    replacementNote: "Replace with PBPP drone or walkthrough still of a serviced Palm Beach County property",
  },
  {
    id: "service-window-cleaning",
    service: "Window Cleaning",
    filePath: `${STOCK_BASE}/services/window-cleaning.webp`,
    alt: "Professional window cleaning at a residential property",
    imageType: "stock",
    source: "https://unsplash.com/photos/person-holding-white-plastic-bottle-c64695cc6952",
    licenseNotes: UNSPLASH,
    usage: ["Homepage service card", "Window cleaning page intro"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "high",
    replacementNote: "Replace with PBPP crew cleaning windows on a local home",
  },
  {
    id: "service-pressure-washing",
    service: "Pressure Washing & Soft Washing",
    filePath: `${STOCK_BASE}/services/pressure-washing.webp`,
    alt: "Clean South Florida home exterior with pool deck and patio",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-and-brown-concrete-house-near-green-trees-during-daytime-d208bec867a1",
    licenseNotes: UNSPLASH,
    usage: ["Homepage service card", "Pressure washing page intro"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "high",
    replacementNote: "Replace with PBPP driveway, patio, or pool deck pressure washing photo",
  },
  {
    id: "service-residential-cleaning",
    service: "Residential Cleaning",
    filePath: `${STOCK_BASE}/services/residential-cleaning.webp`,
    alt: "Bright, clean modern kitchen in a Florida home",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-wooden-table-with-chairs-46c336c7fd55",
    licenseNotes: UNSPLASH,
    usage: ["Homepage service card", "Residential cleaning page intro"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "high",
    replacementNote: "Replace with PBPP residential cleaning in progress or finished room",
  },
  {
    id: "service-commercial-cleaning",
    service: "Commercial Cleaning",
    filePath: `${STOCK_BASE}/services/commercial-cleaning.webp`,
    alt: "Clean, modern office workspace ready for business",
    imageType: "stock",
    source: "https://unsplash.com/photos/macbook-pro-on-table-beside-white-imac-and-magic-mouse-37526070297c",
    licenseNotes: UNSPLASH,
    usage: ["Homepage service card", "Commercial cleaning page intro"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "medium",
    replacementNote: "Replace with PBPP commercial or storefront cleaning photo",
  },
  {
    id: "service-property-care",
    service: "Property & Estate Care",
    filePath: `${STOCK_BASE}/services/property-care.webp`,
    alt: "Well-maintained South Florida property with pool and landscaping",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-and-brown-concrete-house-with-swimming-pool-be6161a56a0c",
    licenseNotes: UNSPLASH,
    usage: ["Homepage service card", "Property care page intro"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "medium",
    replacementNote: "Replace with PBPP estate care or property walkthrough photo",
  },
  {
    id: "service-mobile-detailing",
    service: "Mobile Detailing",
    filePath: `${STOCK_BASE}/services/mobile-detailing.webp`,
    alt: "Clean SUV parked at a residential driveway",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-suv-on-road-during-daytime-bd32c8ce0db2",
    licenseNotes: UNSPLASH,
    usage: ["Homepage service card", "Mobile detailing page intro"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "high",
    replacementNote: "Replace with PBPP mobile detail at customer location",
  },
  {
    id: "path-residential",
    service: "Residential customer path",
    filePath: `${STOCK_BASE}/sections/residential-path.webp`,
    alt: "Bright coastal-style living room in a well-kept home",
    imageType: "decorative",
    source: "https://unsplash.com/photos/gray-couch-and-brown-wooden-table-a197022b5858",
    licenseNotes: UNSPLASH,
    usage: ["Homepage residential customer path"],
    width: 1400,
    height: 933,
    aspect: "landscape",
    overlay: "subtle",
    replacementPriority: "low",
    replacementNote: "Optional — replace with representative residential interior if desired",
  },
  {
    id: "path-commercial",
    service: "Commercial customer path",
    filePath: `${STOCK_BASE}/sections/commercial-path.webp`,
    alt: "Professional office lobby and workspace",
    imageType: "decorative",
    source: "https://unsplash.com/photos/people-sitting-on-chair-beside-table-f200968a6e72",
    licenseNotes: UNSPLASH,
    usage: ["Homepage commercial customer path"],
    width: 1400,
    height: 933,
    aspect: "landscape",
    overlay: "subtle",
    replacementPriority: "low",
    replacementNote: "Optional — replace with PBPP commercial client setting if available",
  },
  {
    id: "section-recurring-care",
    service: "Recurring Property Care",
    filePath: `${STOCK_BASE}/sections/recurring-property-care.webp`,
    alt: "Attractive maintained home exterior with clean walkways and landscaping",
    imageType: "decorative",
    source: "https://unsplash.com/photos/white-and-brown-house-near-green-trees-during-daytime-ce09059eeffa",
    licenseNotes: UNSPLASH,
    usage: ["Homepage recurring property care section"],
    width: 1600,
    height: 900,
    aspect: "wide",
    overlay: "subtle",
    replacementPriority: "medium",
    replacementNote: "Replace with PBPP recurring estate or vacation-home program photo",
  },
  {
    id: "section-how-it-works",
    service: "How It Works",
    filePath: `${STOCK_BASE}/sections/how-it-works.webp`,
    alt: "Clean, well-maintained bedroom interior representing finished service",
    imageType: "decorative",
    source: "https://unsplash.com/photos/white-bed-linen-on-bed-6ed189bf02f4",
    licenseNotes: UNSPLASH,
    usage: ["Homepage how-it-works section background"],
    width: 1600,
    height: 900,
    aspect: "wide",
    overlay: "subtle",
    replacementPriority: "low",
    replacementNote: "Decorative only — low priority for replacement",
  },
  {
    id: "section-final-cta",
    service: "Final CTA",
    filePath: `${STOCK_BASE}/sections/final-cta.webp`,
    alt: "South Florida home exterior at dusk with warm lighting",
    imageType: "decorative",
    source: "https://unsplash.com/photos/white-and-brown-concrete-building-under-blue-sky-during-daytime-ffad4c1539a9",
    licenseNotes: UNSPLASH,
    usage: ["Homepage final estimate CTA background"],
    width: 2000,
    height: 1125,
    aspect: "wide",
    overlay: "cinematic",
    replacementPriority: "low",
    replacementNote: "Decorative CTA background — optional replacement",
  },
  {
    id: "service-carpet-cleaning",
    service: "Carpet & Steam Cleaning",
    filePath: `${STOCK_BASE}/services/carpet-cleaning.webp`,
    alt: "Clean, bright living space with well-maintained flooring",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-wooden-table-with-chairs-cde436f6a4d0",
    licenseNotes: UNSPLASH,
    usage: ["Services page card"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "medium",
    replacementNote: "Replace with PBPP carpet cleaning project photo",
  },
  {
    id: "service-trash-can-cleaning",
    service: "Trash Can Cleaning",
    filePath: `${STOCK_BASE}/services/trash-can-cleaning.webp`,
    alt: "Clean residential driveway and garage area at a South Florida home",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-and-brown-concrete-house-with-swimming-pool-c7171b42498f",
    licenseNotes: UNSPLASH,
    usage: ["Services page card"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "low",
    replacementNote: "Replace with PBPP trash can cleaning service photo",
  },
  {
    id: "service-airbnb-turnover",
    service: "Airbnb & Turnover Cleaning",
    filePath: `${STOCK_BASE}/services/airbnb-turnover.webp`,
    alt: "Furnished rental interior ready for guest arrival",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-wooden-table-with-chairs-757bb62b4baf",
    licenseNotes: UNSPLASH,
    usage: ["Services page card"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "medium",
    replacementNote: "Replace with PBPP short-term rental turnover photo",
  },
  {
    id: "service-property-maintenance",
    service: "Property Maintenance",
    filePath: `${STOCK_BASE}/services/property-maintenance.webp`,
    alt: "Well-kept South Florida home exterior with pool deck and landscaping",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-and-brown-concrete-house-near-green-trees-990dced4db0d",
    licenseNotes: UNSPLASH,
    usage: ["Services page card"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "medium",
    replacementNote: "Replace with PBPP maintenance or punch-list project photo",
  },
  {
    id: "service-vacation-home-checks",
    service: "Vacation Home Checks",
    filePath: `${STOCK_BASE}/services/vacation-home-checks.webp`,
    alt: "Maintained coastal property exterior with pool and landscaping",
    imageType: "stock",
    source: "https://unsplash.com/photos/white-and-brown-concrete-house-with-swimming-pool-be6161a56a0c",
    licenseNotes: UNSPLASH,
    usage: ["Services page card", "Vacation home checks page intro"],
    width: 1200,
    height: 800,
    aspect: "landscape",
    overlay: "card",
    replacementPriority: "medium",
    replacementNote: "Replace with PBPP vacation-home check walkthrough photo",
  },
];

const byId = new Map(SITE_IMAGERY.map((e) => [e.id, e]));

export function getSiteImage(id: string): SiteImageEntry | undefined {
  return byId.get(id);
}

/** Convert inventory entry to MediaAsset for shared image components. */
export function siteImageToMediaAsset(entry: SiteImageEntry): MediaAsset {
  return {
    id: entry.id,
    category: entry.id.startsWith("hero") ? "hero" : "exterior",
    src: entry.filePath,
    alt: entry.alt,
    source: entry.imageType === "real-project" ? "authentic" : "scaffold",
    imageType: entry.imageType,
    focal: entry.focal,
    aspect: entry.aspect,
    overlay: entry.overlay,
    swapNote: entry.replacementNote,
  };
}

export function getSiteImageAsset(id: string): MediaAsset | undefined {
  const entry = getSiteImage(id);
  return entry ? siteImageToMediaAsset(entry) : undefined;
}

/** Service slug → stock image id for cards and page intros */
export const SERVICE_STOCK_IMAGE_IDS: Record<string, string> = {
  "window-cleaning": "service-window-cleaning",
  "pressure-washing": "service-pressure-washing",
  "residential-cleaning": "service-residential-cleaning",
  "commercial-cleaning": "service-commercial-cleaning",
  "property-care": "service-property-care",
  "property-maintenance": "service-property-maintenance",
  "mobile-detailing": "service-mobile-detailing",
  "auto-detailing": "service-mobile-detailing",
  "carpet-steam-cleaning": "service-carpet-cleaning",
  "trash-can-cleaning": "service-trash-can-cleaning",
  "airbnb-services": "service-airbnb-turnover",
  "vacation-home-checks": "service-vacation-home-checks",
};

export function getServiceStockAsset(slug: string) {
  const imageId = SERVICE_STOCK_IMAGE_IDS[slug];
  return imageId ? getSiteImageAsset(imageId) : undefined;
}

export function assertRealProjectImage(entry: SiteImageEntry, context: string): void {
  if (entry.imageType !== "real-project" && process.env.NODE_ENV === "development") {
    console.warn(
      `[PBPP Imagery] ${context}: "${entry.id}" is ${entry.imageType}, not real-project. Do not label as PBPP work.`,
    );
  }
}

/** Images that should be replaced first when real photography is available. */
export function getReplacementPriorityList(): SiteImageEntry[] {
  return [...SITE_IMAGERY].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.replacementPriority] - order[b.replacementPriority];
  });
}
