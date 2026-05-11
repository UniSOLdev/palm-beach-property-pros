import type {
  AddOnServiceConfig,
  CleaningType,
  Condition,
  LaborComplexity,
  PricingConfig,
  PropertyType,
  Turnaround,
  WalkthroughSectionId,
} from "@/lib/walkthrough/types";

export const CLEANING_TYPES = ["Move-Out", "Listing Prep", "Maintenance", "Deep Clean"] as const;

export const OCCUPANCY_OPTIONS = ["Occupied", "Empty"] as const;

export const CONDITION_OPTIONS = ["Light", "Medium", "Heavy"] as const;

export const LABOR_COMPLEXITY_OPTIONS: readonly LaborComplexity[] = [
  "Standard",
  "Elevated",
  "Estate",
] as const;

export const TURNAROUND_OPTIONS: readonly Turnaround[] = [
  "Flexible",
  "Standard",
  "Quick Turnaround",
] as const;

export const PROPERTY_TYPES: readonly PropertyType[] = [
  "Single-family estate",
  "Condo",
  "Townhome",
  "Luxury listing",
  "Seasonal residence",
  "Short-term rental",
  "Commercial suite",
] as const;

export const WALKTHROUGH_SECTIONS: readonly {
  id: WalkthroughSectionId;
  label: string;
  prompt: string;
  aiFocus: string[];
}[] = [
  {
    id: "kitchen",
    label: "Kitchen",
    prompt: "Counters, sink, backsplash, fixtures, baseboards",
    aiFocus: ["grease", "appliance residue", "backsplash detail", "cabinet faces"],
  },
  {
    id: "bathrooms",
    label: "Bathrooms",
    prompt: "Glass, tile, grout, fixtures, vanities",
    aiFocus: ["glass buildup", "grout condition", "hard-water stains", "fixture detail"],
  },
  {
    id: "bedrooms",
    label: "Bedrooms",
    prompt: "Closets, fans, dust, trim, surfaces",
    aiFocus: ["closet shelving", "fan dust", "baseboards", "carpet traffic"],
  },
  {
    id: "livingAreas",
    label: "Living Areas",
    prompt: "Dust, shelving, high-touch details, staging",
    aiFocus: ["built-ins", "high dusting", "staging surfaces", "glass accents"],
  },
  {
    id: "floors",
    label: "Floors",
    prompt: "Hard floors, carpet, transitions, edges",
    aiFocus: ["floor material", "traffic lanes", "edge detail", "carpet extraction"],
  },
  {
    id: "windows",
    label: "Windows",
    prompt: "Interior glass, tracks, sills, screens",
    aiFocus: ["pane count", "track debris", "screen condition", "height/access"],
  },
  {
    id: "walls",
    label: "Walls",
    prompt: "Scuffs, handprints, marks, touch-up areas",
    aiFocus: ["scuffs", "handprints", "paint sensitivity", "listing prep touch-ups"],
  },
  {
    id: "cabinets",
    label: "Cabinets",
    prompt: "Faces, pulls, shelves, interiors",
    aiFocus: ["crumbs", "shelf residue", "hardware detail", "interior cabinet scope"],
  },
  {
    id: "appliances",
    label: "Appliances",
    prompt: "Oven, fridge, dishwasher, washer/dryer",
    aiFocus: ["oven buildup", "fridge residue", "stainless finish", "laundry appliances"],
  },
  {
    id: "exterior",
    label: "Exterior",
    prompt: "Entry, patio, driveway, trash area, access",
    aiFocus: ["driveway stains", "entry presentation", "patio algae", "pressure washing access"],
  },
] as const;

export const ADD_ON_SERVICES: readonly AddOnServiceConfig[] = [
  {
    id: "interiorWindows",
    label: "Interior Windows",
    pricing: { min: 99, max: 275, estimatedHours: 1.5 },
    detail: "Interior panes, sills, and touch-point glass.",
    aiHints: {
      photoTags: ["windows", "glass", "tracks", "sills"],
      upsellTriggers: ["windows", "livingAreas"],
    },
  },
  {
    id: "carpetExtraction",
    label: "Carpet Extraction",
    pricing: { min: 175, max: 450, estimatedHours: 3 },
    detail: "Targeted extraction for bedrooms, stairs, and traffic lanes.",
    aiHints: {
      photoTags: ["carpet", "traffic lanes", "stains"],
      upsellTriggers: ["floors", "bedrooms"],
    },
  },
  {
    id: "wallScuffCleanup",
    label: "Wall/Scuff Cleanup",
    pricing: { min: 95, max: 325, estimatedHours: 1.75 },
    detail: "Visible scuff reduction in halls, entries, and living areas.",
    aiHints: {
      photoTags: ["walls", "scuffs", "handprints"],
      upsellTriggers: ["walls", "livingAreas"],
    },
  },
  {
    id: "cabinetInterior",
    label: "Cabinet Interior Detailing",
    pricing: { min: 125, max: 375, estimatedHours: 2.25 },
    detail: "Interior wipe-downs, crumbs, residue, and shelf edges.",
    aiHints: {
      photoTags: ["cabinet interiors", "crumbs", "shelf residue"],
      upsellTriggers: ["cabinets", "kitchen"],
    },
  },
  {
    id: "pressureWashing",
    label: "Pressure Washing",
    pricing: { min: 150, max: 650, estimatedHours: 3.5 },
    detail: "Driveway, entry, patio, or walkways scoped by surface.",
    aiHints: {
      photoTags: ["driveway", "patio", "algae", "exterior"],
      upsellTriggers: ["exterior"],
    },
  },
  {
    id: "applianceDeepClean",
    label: "Appliance Deep Clean",
    pricing: { min: 125, max: 425, estimatedHours: 2.5 },
    detail: "Oven, fridge, washer/dryer, and stainless detail work.",
    aiHints: {
      photoTags: ["oven", "fridge", "appliances", "stainless"],
      upsellTriggers: ["appliances", "kitchen"],
    },
  },
  {
    id: "odorTreatment",
    label: "Odor Treatment",
    pricing: { min: 95, max: 300, estimatedHours: 1.5 },
    detail: "Deodorizing treatment for smoke, pets, or vacancy odors.",
    aiHints: {
      photoTags: ["pets", "smoke", "odor", "vacancy"],
      upsellTriggers: ["livingAreas", "bedrooms"],
    },
  },
] as const;

export const WALKTHROUGH_PRICING_CONFIG: PricingConfig = {
  cleaningProfiles: {
    "Move-Out": { rateLow: 0.18, rateHigh: 0.26, minimum: 325, targetHourlyRate: 85 },
    "Listing Prep": { rateLow: 0.2, rateHigh: 0.3, minimum: 375, targetHourlyRate: 95 },
    Maintenance: { rateLow: 0.12, rateHigh: 0.18, minimum: 185, targetHourlyRate: 75 },
    "Deep Clean": { rateLow: 0.24, rateHigh: 0.36, minimum: 425, targetHourlyRate: 95 },
  } satisfies Record<CleaningType, PricingConfig["cleaningProfiles"][CleaningType]>,
  occupiedMultiplier: 1.1,
  conditionAdjustments: {
    Light: { low: 0, high: 0, laborHours: 0 },
    Medium: { low: 25, high: 55, laborHours: 0.25 },
    Heavy: { low: 65, high: 125, laborHours: 0.35 },
  } satisfies Record<Condition, PricingConfig["conditionAdjustments"][Condition]>,
  needsAddOnAdjustment: { low: 20, high: 45, laborHours: 0.15 },
  roomAdjustments: {
    bedroomHours: 0.45,
    bathroomHours: 0.75,
    kitchenHours: 0.9,
    livingAreaHours: 0.4,
    levelHours: 0.25,
  },
  laborComplexityMultipliers: {
    Standard: 1,
    Elevated: 1.12,
    Estate: 1.25,
  } satisfies Record<LaborComplexity, number>,
  turnaroundMultipliers: {
    Flexible: 1,
    Standard: 1.04,
    "Quick Turnaround": 1.12,
  } satisfies Record<Turnaround, number>,
  crewThresholds: [
    { minHours: 12, crewSize: 4 },
    { minHours: 8, crewSize: 3 },
    { minHours: 4.5, crewSize: 2 },
    { minHours: 0, crewSize: 1 },
  ],
  luxuryRecommendation: {
    addOnCount: 4,
    heavyConditionCount: 2,
    flaggedSectionCount: 5,
    luxuryScaleScore: 0.72,
  },
};
