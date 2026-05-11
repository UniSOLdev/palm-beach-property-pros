import { ADD_ON_SERVICES, WALKTHROUGH_PRICING_CONFIG } from "@/lib/walkthrough/config";
import type {
  AddOnId,
  AddOnServiceConfig,
  AiQuoteSignals,
  PricingConfig,
  QuoteResult,
  WalkthroughJob,
} from "@/lib/walkthrough/types";

export function calculateWalkthroughQuote(
  job: WalkthroughJob,
  config: PricingConfig = WALKTHROUGH_PRICING_CONFIG,
  addOns: readonly AddOnServiceConfig[] = ADD_ON_SERVICES,
  aiSignals?: AiQuoteSignals,
): QuoteResult {
  const squareFootage = parseNumber(job.property.squareFootage);
  const profile = config.cleaningProfiles[job.property.serviceType];
  const hasSquareFootage = squareFootage > 0;
  const baseline = hasSquareFootage ? squareFootage : profile.minimum / profile.rateLow;
  const occupiedMultiplier = job.property.occupancy === "Occupied" ? config.occupiedMultiplier : 1;
  const checklistItems = Object.values(job.checklist);
  const heavyCount = checklistItems.filter((item) => item.condition === "Heavy").length;
  const addOnFlagCount = checklistItems.filter((item) => item.needsAddOn).length;
  const roomHours = getRoomLaborHours(job, config);
  const complexityMultiplier = config.laborComplexityMultipliers[job.property.laborComplexity];
  const turnaroundMultiplier = config.turnaroundMultipliers[job.property.turnaround];

  const conditionLow = checklistItems.reduce(
    (total, item) => total + config.conditionAdjustments[item.condition].low,
    0,
  );
  const conditionHigh = checklistItems.reduce(
    (total, item) => total + config.conditionAdjustments[item.condition].high,
    0,
  );
  const conditionLaborHours = checklistItems.reduce(
    (total, item) => total + config.conditionAdjustments[item.condition].laborHours,
    0,
  );

  const flaggedLow = addOnFlagCount * config.needsAddOnAdjustment.low;
  const flaggedHigh = addOnFlagCount * config.needsAddOnAdjustment.high;
  const flaggedLaborHours = addOnFlagCount * config.needsAddOnAdjustment.laborHours;

  const selectedAddOns = getSelectedAddOns(job.selectedAddOnIds, addOns);
  const addOnLow = selectedAddOns.reduce((total, item) => total + item.pricing.min, 0);
  const addOnHigh = selectedAddOns.reduce((total, item) => total + item.pricing.max, 0);
  const addOnHours = selectedAddOns.reduce((total, item) => total + item.pricing.estimatedHours, 0);

  const baseLow =
    (Math.max(profile.minimum, baseline * profile.rateLow) * occupiedMultiplier + conditionLow + flaggedLow) *
    complexityMultiplier;
  const baseHigh =
    (Math.max(profile.minimum + 75, baseline * profile.rateHigh) * occupiedMultiplier +
      conditionHigh +
      flaggedHigh) *
    complexityMultiplier *
    turnaroundMultiplier;

  const formulaLaborHours = roundHalf(
    Math.max(
      2,
      baseHigh / profile.targetHourlyRate +
        addOnHours +
        conditionLaborHours +
        flaggedLaborHours +
        roomHours,
    ),
  );
  const laborHours = aiSignals?.estimatedLaborHours
    ? roundHalf(Math.max(formulaLaborHours, aiSignals.estimatedLaborHours))
    : formulaLaborHours;
  const crewSize = aiSignals?.recommendedCrewSize
    ? Math.max(getCrewSize(laborHours, config), aiSignals.recommendedCrewSize)
    : getCrewSize(laborHours, config);
  const suggestedAddOnIds = getSuggestedAddOnIds(job.selectedAddOnIds, aiSignals?.suggestedAddOnIds);
  const difficultyRating = getDifficultyRating({
    laborHours,
    heavyCount,
    addOnFlagCount,
    complexity: job.property.laborComplexity,
  });
  const pricingConfidence = getPricingConfidence({
    hasSquareFootage,
    photoCount: getPhotoCount(job),
    completedSectionCount: checklistItems.filter((item) => item.completed).length,
    selectedAddOnCount: selectedAddOns.length,
  });
  const badges = getBadges({
    luxuryRecommended: isLuxuryPrepRecommended({
      selectedAddOnCount: selectedAddOns.length,
      heavyCount,
      addOnFlagCount,
      luxuryScaleScore: aiSignals?.luxuryScaleScore,
      config,
    }),
    heavyCount,
    addOnFlagCount,
    turnaround: job.property.turnaround,
    laborHours,
    job,
    suggestedBadges: aiSignals?.suggestedBadges,
  });

  return {
    baseLow,
    baseHigh,
    addOnLow,
    addOnHigh,
    totalLow: baseLow + addOnLow,
    totalHigh: baseHigh + addOnHigh,
    laborHours,
    crewSize,
    estimatedDuration: getEstimatedDuration(laborHours, crewSize),
    pricingConfidence,
    difficultyRating,
    heavyCount,
    addOnFlagCount,
    luxuryRecommended: badges.includes("Luxury Listing Prep"),
    badges,
    internalNotes: getInternalNotes({
      pricingConfidence,
      difficultyRating,
      addOnFlagCount,
      selectedAddOnCount: selectedAddOns.length,
      photoCount: getPhotoCount(job),
      turnaround: job.property.turnaround,
    }),
    aiAssisted: Boolean(aiSignals),
    suggestedAddOnIds,
  };
}

export function getSelectedAddOns(
  selectedAddOnIds: readonly AddOnId[],
  addOns: readonly AddOnServiceConfig[] = ADD_ON_SERVICES,
) {
  const selected = new Set(selectedAddOnIds);
  return addOns.filter((service) => selected.has(service.id));
}

export function parseNumber(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundHalf(value: number) {
  return Math.ceil(value * 2) / 2;
}

function getCrewSize(laborHours: number, config: PricingConfig) {
  return config.crewThresholds.find((threshold) => laborHours >= threshold.minHours)?.crewSize ?? 1;
}

function getRoomLaborHours(job: WalkthroughJob, config: PricingConfig) {
  const counts = job.property.roomCounts;

  return (
    parseNumber(counts.bedrooms) * config.roomAdjustments.bedroomHours +
    parseNumber(counts.bathrooms) * config.roomAdjustments.bathroomHours +
    Math.max(1, parseNumber(counts.kitchens)) * config.roomAdjustments.kitchenHours +
    parseNumber(counts.livingAreas) * config.roomAdjustments.livingAreaHours +
    parseNumber(counts.levels) * config.roomAdjustments.levelHours
  );
}

function getPhotoCount(job: WalkthroughJob) {
  return job.propertyPhotos.length;
}

function getEstimatedDuration(laborHours: number, crewSize: number) {
  const siteHours = roundHalf(laborHours / Math.max(1, crewSize));
  const low = Math.max(1.5, siteHours - 0.5);
  const high = siteHours + 0.75;

  return `${low.toFixed(1)}-${high.toFixed(1)} hrs on-site`;
}

function getPricingConfidence({
  hasSquareFootage,
  photoCount,
  completedSectionCount,
  selectedAddOnCount,
}: {
  hasSquareFootage: boolean;
  photoCount: number;
  completedSectionCount: number;
  selectedAddOnCount: number;
}) {
  const score =
    (hasSquareFootage ? 2 : 0) +
    Math.min(3, Math.floor(photoCount / 3)) +
    Math.min(3, Math.floor(completedSectionCount / 3)) +
    (selectedAddOnCount > 0 ? 1 : 0);

  if (score >= 7) {
    return "High";
  }
  if (score >= 4) {
    return "Medium";
  }
  return "Low";
}

function getDifficultyRating({
  laborHours,
  heavyCount,
  addOnFlagCount,
  complexity,
}: {
  laborHours: number;
  heavyCount: number;
  addOnFlagCount: number;
  complexity: WalkthroughJob["property"]["laborComplexity"];
}) {
  if (complexity === "Estate" || laborHours >= 12) {
    return "Estate";
  }
  if (heavyCount >= 4 || laborHours >= 9) {
    return "Heavy";
  }
  if (complexity === "Elevated" || addOnFlagCount >= 3 || laborHours >= 6) {
    return "Elevated";
  }
  if (laborHours >= 3.5) {
    return "Standard";
  }
  return "Light";
}

function getBadges({
  luxuryRecommended,
  heavyCount,
  addOnFlagCount,
  turnaround,
  laborHours,
  job,
  suggestedBadges,
}: {
  luxuryRecommended: boolean;
  heavyCount: number;
  addOnFlagCount: number;
  turnaround: WalkthroughJob["property"]["turnaround"];
  laborHours: number;
  job: WalkthroughJob;
  suggestedBadges?: string[];
}) {
  const badges: string[] = [];
  const notes = getSearchableJobText(job);

  if (luxuryRecommended) {
    badges.push("Luxury Listing Prep");
  }
  if (heavyCount >= 3 || addOnFlagCount >= 4 || laborHours >= 9) {
    badges.push("Heavy Detail Load");
  }
  if (job.property.serviceType === "Listing Prep") {
    badges.push("Realtor Sensitive");
  }
  if (turnaround === "Quick Turnaround") {
    badges.push("Quick Turnaround");
  }
  if (/(delicate|antique|lacquer|stone|wood|finish)/i.test(notes)) {
    badges.push("Delicate Surfaces");
  }
  if (/(marble|onyx|travertine|limestone|high-end|designer)/i.test(notes)) {
    badges.push("Marble/High-End Finish");
  }
  if (/(construction|renovation|drywall|paint dust|post-construction)/i.test(notes)) {
    badges.push("Construction Dust");
  }
  if (/(pet|hair|fur|dog|cat)/i.test(notes)) {
    badges.push("Pet Hair Heavy");
  }
  for (const badge of suggestedBadges ?? []) {
    badges.push(badge);
  }

  return Array.from(new Set(badges));
}

function getInternalNotes({
  pricingConfidence,
  difficultyRating,
  addOnFlagCount,
  selectedAddOnCount,
  photoCount,
  turnaround,
}: {
  pricingConfidence: string;
  difficultyRating: string;
  addOnFlagCount: number;
  selectedAddOnCount: number;
  photoCount: number;
  turnaround: string;
}) {
  const notes = [
    `${pricingConfidence} pricing confidence based on current walkthrough data.`,
    `${difficultyRating} difficulty load; confirm crew lead and equipment before dispatch.`,
  ];

  if (addOnFlagCount > selectedAddOnCount) {
    notes.push("Some sections are flagged for add-ons that are not selected yet.");
  }
  if (photoCount < 6) {
    notes.push("Capture more room photos before final pricing if the property is large or occupied.");
  }
  if (turnaround === "Quick Turnaround") {
    notes.push("Quick turnaround may require tighter arrival staging and a larger crew.");
  }

  return notes;
}

function getSuggestedAddOnIds(selectedAddOnIds: readonly AddOnId[], suggestedAddOnIds?: readonly AddOnId[]) {
  if (!suggestedAddOnIds) {
    return [];
  }

  const selected = new Set(selectedAddOnIds);
  return suggestedAddOnIds.filter((id) => !selected.has(id));
}

function isLuxuryPrepRecommended({
  selectedAddOnCount,
  heavyCount,
  addOnFlagCount,
  luxuryScaleScore,
  config,
}: {
  selectedAddOnCount: number;
  heavyCount: number;
  addOnFlagCount: number;
  luxuryScaleScore?: number;
  config: PricingConfig;
}) {
  const thresholds = config.luxuryRecommendation;

  return (
    selectedAddOnCount >= thresholds.addOnCount ||
    (selectedAddOnCount >= 3 && heavyCount >= thresholds.heavyConditionCount) ||
    addOnFlagCount >= thresholds.flaggedSectionCount ||
    (luxuryScaleScore ?? 0) >= thresholds.luxuryScaleScore
  );
}

function getSearchableJobText(job: WalkthroughJob) {
  return [
    job.property.notes,
    job.property.propertyType,
    ...Object.values(job.checklist).map((item) => item.notes),
    ...job.propertyPhotos.flatMap((photo) => [photo.name, ...photo.tags]),
  ].join(" ");
}
