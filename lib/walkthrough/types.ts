export type CleaningType = "Move-Out" | "Listing Prep" | "Maintenance" | "Deep Clean";
export type Occupancy = "Occupied" | "Empty";
export type Condition = "Light" | "Medium" | "Heavy";
export type LaborComplexity = "Standard" | "Elevated" | "Estate";
export type Turnaround = "Flexible" | "Standard" | "Quick Turnaround";
export type PricingConfidence = "High" | "Medium" | "Low";
export type DifficultyRating = "Light" | "Standard" | "Elevated" | "Heavy" | "Estate";
export type EstimateViewMode = "internal" | "client";

export type PropertyType =
  | "Single-family estate"
  | "Condo"
  | "Townhome"
  | "Luxury listing"
  | "Seasonal residence"
  | "Short-term rental"
  | "Commercial suite";

export type WalkthroughSectionId =
  | "kitchen"
  | "bathrooms"
  | "bedrooms"
  | "livingAreas"
  | "floors"
  | "windows"
  | "walls"
  | "cabinets"
  | "appliances"
  | "exterior";

export type AddOnId =
  | "interiorWindows"
  | "carpetExtraction"
  | "wallScuffCleanup"
  | "cabinetInterior"
  | "pressureWashing"
  | "applianceDeepClean"
  | "odorTreatment";

export type PhotoScope = "property" | WalkthroughSectionId;
export type PhotoTag = WalkthroughSectionId | "other";

export type PhotoAnalysisStatus = "not-ready" | "queued" | "analyzed" | "needs-review";

export type WalkthroughPhoto = {
  id: string;
  name: string;
  scope: PhotoScope;
  size: number;
  type: string;
  previewUrl?: string;
  tags: PhotoTag[];
  capturedAt: string;
  source: "camera-or-library";
  uploadStatus: "ready" | "processing" | "error";
  analysisStatus: PhotoAnalysisStatus;
  storageKey?: string;
  aiSummary?: string;
  aiTags?: string[];
};

export type PropertyIntake = {
  clientName: string;
  address: string;
  phone: string;
  email: string;
  squareFootage: string;
  propertyType: PropertyType;
  occupancy: Occupancy;
  serviceType: CleaningType;
  roomCounts: {
    bedrooms: string;
    bathrooms: string;
    kitchens: string;
    livingAreas: string;
    levels: string;
  };
  laborComplexity: LaborComplexity;
  turnaround: Turnaround;
  notes: string;
};

export type ChecklistItem = {
  condition: Condition;
  notes: string;
  needsAddOn: boolean;
  completed: boolean;
  voiceMemo?: VoiceMemo;
};

export type VoiceMemo = {
  id: string;
  label: string;
  recordedAt: string;
  durationLabel: string;
  status: "placeholder" | "recorded" | "transcribed";
  transcript?: string;
};

export type ChecklistState = Record<WalkthroughSectionId, ChecklistItem>;

export type WalkthroughJob = {
  id: string;
  version: 1;
  status: "draft" | "review-ready" | "approved";
  createdAt: string;
  updatedAt: string;
  property: PropertyIntake;
  propertyPhotos: WalkthroughPhoto[];
  checklist: ChecklistState;
  selectedAddOnIds: AddOnId[];
  estimateViewMode: EstimateViewMode;
};

export type AddOnPricing = {
  min: number;
  max: number;
  estimatedHours: number;
};

export type AddOnServiceConfig = {
  id: AddOnId;
  label: string;
  pricing: AddOnPricing;
  detail: string;
  aiHints: {
    photoTags: string[];
    upsellTriggers: WalkthroughSectionId[];
  };
};

export type CleaningPricingProfile = {
  rateLow: number;
  rateHigh: number;
  minimum: number;
  targetHourlyRate: number;
};

export type PricingConfig = {
  cleaningProfiles: Record<CleaningType, CleaningPricingProfile>;
  occupiedMultiplier: number;
  conditionAdjustments: Record<Condition, { low: number; high: number; laborHours: number }>;
  needsAddOnAdjustment: { low: number; high: number; laborHours: number };
  roomAdjustments: {
    bedroomHours: number;
    bathroomHours: number;
    kitchenHours: number;
    livingAreaHours: number;
    levelHours: number;
  };
  laborComplexityMultipliers: Record<LaborComplexity, number>;
  turnaroundMultipliers: Record<Turnaround, number>;
  crewThresholds: Array<{ minHours: number; crewSize: number }>;
  luxuryRecommendation: {
    addOnCount: number;
    heavyConditionCount: number;
    flaggedSectionCount: number;
    luxuryScaleScore: number;
  };
};

export type AiQuoteSignals = {
  luxuryScaleScore?: number;
  recommendedCrewSize?: number;
  estimatedLaborHours?: number;
  suggestedAddOnIds?: AddOnId[];
  suggestedBadges?: string[];
  scopeSummary?: string;
  invoiceLineItems?: Array<{ label: string; amount: number }>;
};

export type QuoteResult = {
  baseLow: number;
  baseHigh: number;
  addOnLow: number;
  addOnHigh: number;
  totalLow: number;
  totalHigh: number;
  laborHours: number;
  crewSize: number;
  estimatedDuration: string;
  pricingConfidence: PricingConfidence;
  difficultyRating: DifficultyRating;
  heavyCount: number;
  addOnFlagCount: number;
  luxuryRecommended: boolean;
  badges: string[];
  internalNotes: string[];
  aiAssisted: boolean;
  suggestedAddOnIds: AddOnId[];
};
