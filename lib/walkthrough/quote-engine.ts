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
  const moderateCount = checklistItems.filter((item) => item.condition === "Moderate").length;
  const heavyCount = checklistItems.filter((item) => item.condition === "Heavy").length;
  const addOnFlagCount = checklistItems.filter((item) => item.needsAddOn).length;

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
    Math.max(profile.minimum, baseline * profile.rateLow) * occupiedMultiplier + conditionLow + flaggedLow;
  const baseHigh =
    Math.max(profile.minimum + 75, baseline * profile.rateHigh) * occupiedMultiplier +
    conditionHigh +
    flaggedHigh;

  const formulaLaborHours = roundHalf(
    Math.max(2, baseHigh / profile.targetHourlyRate + addOnHours + conditionLaborHours + flaggedLaborHours),
  );
  const laborHours = aiSignals?.estimatedLaborHours
    ? roundHalf(Math.max(formulaLaborHours, aiSignals.estimatedLaborHours))
    : formulaLaborHours;
  const crewSize = aiSignals?.recommendedCrewSize
    ? Math.max(getCrewSize(laborHours, config), aiSignals.recommendedCrewSize)
    : getCrewSize(laborHours, config);
  const suggestedAddOnIds = getSuggestedAddOnIds(job.selectedAddOnIds, aiSignals?.suggestedAddOnIds);

  return {
    baseLow,
    baseHigh,
    addOnLow,
    addOnHigh,
    totalLow: baseLow + addOnLow,
    totalHigh: baseHigh + addOnHigh,
    laborHours,
    crewSize,
    heavyCount,
    addOnFlagCount,
    luxuryRecommended: isLuxuryPrepRecommended({
      selectedAddOnCount: selectedAddOns.length,
      heavyCount,
      addOnFlagCount,
      luxuryScaleScore: aiSignals?.luxuryScaleScore,
      config,
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
