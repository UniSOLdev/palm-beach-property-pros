import { getSelectedAddOns } from "@/lib/walkthrough/quote-engine";
import type { AiQuoteSignals, QuoteResult, WalkthroughJob } from "@/lib/walkthrough/types";

export function generateClientScope(job: WalkthroughJob, quote: QuoteResult, aiSignals?: AiQuoteSignals) {
  if (aiSignals?.scopeSummary) {
    return aiSignals.scopeSummary;
  }

  const serviceLabel = getServiceLabel(job.property.serviceType);
  const propertyLabel = job.property.propertyType
    ? ` at the ${job.property.propertyType.toLowerCase()}`
    : "";
  const selectedLabels = getSelectedAddOns(job.selectedAddOnIds).map((item) => item.label);
  const addOnSentence =
    selectedLabels.length > 0
      ? ` Approved enhancements include ${formatList(selectedLabels).toLowerCase()}.`
      : "";
  const recommendationSentence = quote.luxuryRecommended
    ? " PBPP recommends a luxury listing-prep finish for presentation-sensitive areas and final owner or agent review."
    : "";
  const conditionSentence =
    quote.heavyCount > 0 || quote.addOnFlagCount > 0
      ? " Areas noted during the walkthrough will receive priority detailing; specialty work outside the agreed scope will be confirmed before completion."
      : "";
  const disclaimer =
    " Final pricing assumes normal access, available utilities, and no concealed damage, excessive debris, or hazardous materials.";

  return `PBPP will prepare the property with a ${serviceLabel}${propertyLabel}, focused on kitchen and bath detailing, floor presentation, visible dust removal, touch-point cleaning, and a final walkthrough-ready finish.${addOnSentence}${recommendationSentence}${conditionSentence}${disclaimer}`;
}

export function formatList(items: string[]) {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function getServiceLabel(serviceType: WalkthroughJob["property"]["serviceType"]) {
  switch (serviceType) {
    case "Move-Out":
      return "move-out cleaning scope";
    case "Listing Prep":
      return "luxury listing-prep cleaning scope";
    case "Maintenance":
      return "property maintenance cleaning scope";
    case "Deep Clean":
      return "deep-detail cleaning scope";
  }
}
