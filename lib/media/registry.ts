import type {
  FieldStep,
  MediaAsset,
  OperationalProof,
  ProjectRecap,
  TransformationProject,
} from "./types";

/**
 * Central media registry for Palm Beach Property Pros.
 *
 * TEMPORARY: scaffold entries use editorial luxury-listing photography
 * (Zillow / Compass / Sotheby's aesthetic) until authentic PBPP media replaces them.
 *
 * To swap in real media: update `src` (and optional `videoSrc`) on the asset id,
 * set `source: "authentic"`, and set `isScaffold: false` on related projects.
 */

const S = "scaffold" as const;

/** Curated editorial photography — warm, natural, architectural, South Florida luxury. */
const RAW = {
  heroDuskEstate: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
  waterfrontTwilight: "https://images.unsplash.com/photo-1613979617049-0ee344255b08",
  poolDeckEstate: "https://images.unsplash.com/photo-1600585154526-990dced4db0d",
  architecturalExterior: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
  estateDriveway: "https://images.unsplash.com/photo-1600573472592-401b489a9119",
  tropicalLandscaping: "https://images.unsplash.com/photo-1605276374104-de8862a3d462",
  luxuryInterior: "https://images.unsplash.com/photo-1600210492492-0946911122ea",
  kitchenNaturalLight: "https://images.unsplash.com/photo-1600566752355-35778368630a",
  livingCoastal: "https://images.unsplash.com/photo-1600607687929-7526a8a2ee4d",
  waterfrontAerial: "https://images.unsplash.com/photo-1518780669439-936594081ea8",
  estateEntrance: "https://images.unsplash.com/photo-1600607687644-c7171b42498f",
  /** Softer / pre-refresh reference conditions for transformation scaffolding. */
  exteriorPreRefresh: "https://images.unsplash.com/photo-1564013469638-3c78f9e4a8c8",
  interiorLivedIn: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
} as const;

function asset(
  partial: Omit<MediaAsset, "source"> & { source?: MediaAsset["source"] },
): MediaAsset {
  return { source: S, ...partial };
}

export const MEDIA_REGISTRY = {
  hero: {
    primary: asset({
      id: "hero.primary",
      category: "hero",
      src: RAW.heroDuskEstate,
      alt: "Luxury Palm Beach estate exterior at dusk with pool and landscaping",
      focal: "object-[center_38%]",
      aspect: "hero",
      overlay: "cinematic",
      location: "Palm Beach County",
      swapNote: "Replace with PBPP dusk drone or walkthrough still",
    }),
  },
  divisions: {
    exterior: asset({
      id: "divisions.exterior",
      category: "exterior",
      src: RAW.architecturalExterior,
      alt: "South Florida luxury home exterior with clean architectural lines",
      focal: "object-[center_42%]",
      aspect: "landscape",
      overlay: "card",
      location: "Palm Beach Gardens",
      swapNote: "Replace with PBPP pressure wash / glass / driveway project",
    }),
    interior: asset({
      id: "divisions.interior",
      category: "interior",
      src: RAW.luxuryInterior,
      alt: "Luxury interior with natural window light and refined finishes",
      focal: "object-center",
      aspect: "landscape",
      overlay: "card",
      location: "Jupiter",
      swapNote: "Replace with PBPP estate reset / turnover capture",
    }),
    propertySupport: asset({
      id: "divisions.property-support",
      category: "property-support",
      src: RAW.estateEntrance,
      alt: "Estate entrance and arrival sequence at a Palm Beach property",
      focal: "object-[center_40%]",
      aspect: "landscape",
      overlay: "card",
      location: "North Palm Beach",
      swapNote: "Replace with PBPP crew coordination / checklist media",
    }),
  },
  audience: asset({
    id: "audience.estate-driveway",
    category: "local",
    src: RAW.estateDriveway,
    alt: "Luxury estate driveway and arrival court in Palm Beach County",
    focal: "object-[center_35%]",
    aspect: "landscape",
    overlay: "subtle",
    location: "Palm Beach County",
    swapNote: "Replace with PBPP client property type collage",
  }),
  operations: {
    poolDeck: asset({
      id: "operations.pool-deck",
      category: "exterior",
      src: RAW.poolDeckEstate,
      alt: "Pool deck and outdoor living at a coastal luxury home",
      focal: "object-[center_45%]",
      aspect: "portrait",
      overlay: "card",
      location: "Juno Beach",
      swapNote: "Replace with PBPP exterior detail execution clip",
    }),
    landscaping: asset({
      id: "operations.landscaping",
      category: "exterior",
      src: RAW.tropicalLandscaping,
      alt: "Tropical landscaping and curb presence at a South Florida estate",
      focal: "object-center",
      aspect: "landscape",
      overlay: "subtle",
      location: "Palm Beach Gardens",
      swapNote: "Replace with PBPP landscaping support documentation",
    }),
  },
  local: {
    waterfront: asset({
      id: "local.waterfront",
      category: "local",
      src: RAW.waterfrontAerial,
      alt: "Waterfront luxury homes along the Palm Beach County coast",
      focal: "object-center",
      aspect: "wide",
      overlay: "subtle",
      location: "Palm Beach County",
      swapNote: "Replace with PBPP service-area drone reel",
    }),
  },
} as const satisfies Record<string, unknown>;

export const TRANSFORMATION_PROJECTS: readonly TransformationProject[] = [
  {
    id: "driveway-exterior-refresh",
    title: "Estate driveway & hardscape refresh",
    location: "Palm Beach Gardens",
    division: "exterior",
    timeframe: "48-hour turnaround",
    summary:
      "Salt-stained pavers, pool deck edges, and arrival hardscape restored to listing-ready curb presence.",
    scope: ["Pressure washing", "Paver rinse", "Pool deck edges", "Glass touch-up"],
    isScaffold: true,
    before: asset({
      id: "transform.driveway.before",
      category: "transformation",
      src: RAW.exteriorPreRefresh,
      alt: "Reference property exterior prior to hardscape refresh",
      focal: "object-[center_40%]",
      aspect: "wide",
      swapNote: "Replace with real PBPP before photo",
    }),
    after: asset({
      id: "transform.driveway.after",
      category: "transformation",
      src: RAW.estateDriveway,
      alt: "Reference property arrival court after exterior refresh",
      focal: "object-[center_35%]",
      aspect: "wide",
      swapNote: "Replace with real PBPP after photo",
    }),
  },
  {
    id: "turnover-interior-reset",
    title: "Seasonal interior reset",
    location: "Jupiter",
    division: "interior",
    timeframe: "Same-week estate reopen",
    summary:
      "Full interior reset, kitchen detail, and staging readiness before owners returned for season.",
    scope: ["Deep reset", "Kitchen detail", "Floor care", "Staging readiness check"],
    isScaffold: true,
    before: asset({
      id: "transform.interior.before",
      category: "transformation",
      src: RAW.interiorLivedIn,
      alt: "Reference interior condition prior to estate reset",
      focal: "object-center",
      aspect: "wide",
      swapNote: "Replace with real PBPP before photo",
    }),
    after: asset({
      id: "transform.interior.after",
      category: "transformation",
      src: RAW.kitchenNaturalLight,
      alt: "Reference kitchen and interior after reset",
      focal: "object-center",
      aspect: "wide",
      swapNote: "Replace with real PBPP after photo",
    }),
  },
] as const;

export const PROJECT_RECAPS: readonly ProjectRecap[] = [
  {
    id: "waterfront-exterior-program",
    title: "Waterfront exterior program",
    location: "North Palm Beach",
    division: "Exterior care",
    duration: "Recurring · bi-weekly",
    handled: ["Glass lines", "Pool deck rinse", "Lanai surfaces", "Salt exposure checks"],
    isScaffold: true,
    image: asset({
      id: "recap.waterfront",
      category: "exterior",
      src: RAW.waterfrontTwilight,
      alt: "Waterfront estate at twilight — representative property type",
      focal: "object-[center_40%]",
      aspect: "landscape",
      overlay: "card",
      swapNote: "Replace with PBPP waterfront project recap",
    }),
  },
  {
    id: "airbnb-turnover-cadence",
    title: "Turnover execution cadence",
    location: "West Palm Beach",
    division: "Property support",
    duration: "Per booking · SOP-aligned",
    handled: ["Linen reset", "Staging check", "Photo walkthrough", "Owner notification"],
    isScaffold: true,
    image: asset({
      id: "recap.turnover",
      category: "property-support",
      src: RAW.livingCoastal,
      alt: "Coastal living space prepared for guest arrival",
      focal: "object-center",
      aspect: "landscape",
      overlay: "card",
      swapNote: "Replace with PBPP turnover walkthrough still",
    }),
  },
  {
    id: "seasonal-estate-open",
    title: "Seasonal estate open",
    location: "Palm Beach",
    division: "Interior care",
    duration: "72-hour open sequence",
    handled: ["Interior reset", "HVAC filter swap", "Pantry refresh", "Arrival checklist"],
    isScaffold: true,
    image: asset({
      id: "recap.seasonal-open",
      category: "interior",
      src: RAW.luxuryInterior,
      alt: "Estate interior prepared for seasonal arrival",
      focal: "object-center",
      aspect: "landscape",
      overlay: "card",
      swapNote: "Replace with PBPP seasonal open documentation",
    }),
  },
] as const;

export const OPERATIONAL_PROOF: readonly OperationalProof[] = [
  {
    id: "written-scope",
    title: "Written scope",
    description: "Every visit starts with documented scope, access notes, and agreed checkpoints.",
    icon: "scope",
  },
  {
    id: "photo-checklists",
    title: "Photo checklists",
    description: "Field teams capture completion photos aligned to your property SOPs.",
    icon: "photos",
  },
  {
    id: "walkthrough-notes",
    title: "Walkthrough notes",
    description: "Walkthrough summaries for owners, managers, and seasonal stakeholders.",
    icon: "report",
  },
  {
    id: "property-log",
    title: "Property log",
    description: "Recurring programs maintain a running record of visits and observations.",
    icon: "log",
  },
  {
    id: "owner-visibility",
    title: "Owner visibility",
    description: "Quotes, scheduling, invoices, and approvals in one client platform.",
    icon: "portal",
  },
  {
    id: "crew-checklists",
    title: "Crew checklists",
    description: "Repeatable execution standards—not one-off cleaning visits.",
    icon: "checklist",
  },
] as const;

export const FIELD_EXECUTION_STEPS: readonly FieldStep[] = [
  {
    id: "scope",
    label: "Scope & access review",
    detail: "Photos, gate codes, pet notes, and substrate details captured before dispatch.",
  },
  {
    id: "schedule",
    label: "Written schedule",
    detail: "Confirmed arrival windows aligned to occupancy, weather, and operating hours.",
  },
  {
    id: "execute",
    label: "Crew execution",
    detail: "Checklist-driven field work with division-specific standards and equipment.",
  },
  {
    id: "document",
    label: "Documentation delivery",
    detail: "Completion photos, walkthrough notes, and next-visit recommendations when applicable.",
  },
] as const;

export const LOCAL_MARKETS = [
  "Palm Beach",
  "Palm Beach Gardens",
  "Jupiter",
  "Juno Beach",
  "North Palm Beach",
  "West Palm Beach",
  "Delray Beach",
  "Boynton Beach",
] as const;

/** Lookup helper for swapping media by stable id. */
export function getMediaById(id: string): MediaAsset | undefined {
  const walk = (value: unknown): MediaAsset | undefined => {
    if (!value || typeof value !== "object") return undefined;
    if ("id" in value && (value as MediaAsset).id === id) return value as MediaAsset;
    for (const nested of Object.values(value)) {
      const found = walk(nested);
      if (found) return found;
    }
    return undefined;
  };
  return walk(MEDIA_REGISTRY);
}

/** Backward-compatible homepage image map — prefer MEDIA_REGISTRY directly. */
export const HOME_IMAGES = {
  hero: MEDIA_REGISTRY.hero.primary.src,
  exterior: MEDIA_REGISTRY.divisions.exterior.src,
  interior: MEDIA_REGISTRY.divisions.interior.src,
  propertySupport: MEDIA_REGISTRY.divisions.propertySupport.src,
  operations: MEDIA_REGISTRY.audience.src,
  poolDeck: MEDIA_REGISTRY.operations.poolDeck.src,
} as const;
