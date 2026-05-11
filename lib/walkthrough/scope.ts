import { getSelectedAddOns } from "@/lib/walkthrough/quote-engine";
import type { AiQuoteSignals, QuoteResult, WalkthroughJob } from "@/lib/walkthrough/types";

export function generateClientScope(job: WalkthroughJob, quote: QuoteResult, aiSignals?: AiQuoteSignals) {
  if (aiSignals?.scopeSummary) {
    return aiSignals.scopeSummary;
  }

  const serviceLabel = job.property.serviceType.toLowerCase();
  const propertyLabel = job.property.propertyType
    ? ` for this ${job.property.propertyType.toLowerCase()}`
    : "";
  const selectedLabels = getSelectedAddOns(job.selectedAddOnIds).map((item) => item.label);
  const addOnSentence =
    selectedLabels.length > 0
      ? ` Selected add-on services include ${formatList(selectedLabels).toLowerCase()}.`
      : "";
  const conditionSentence =
    quote.heavyCount > 0 || quote.addOnFlagCount > 0
      ? " PBPP will prioritize the noted walkthrough areas and confirm any specialty work before service begins."
      : "";

  return `For the agreed service, PBPP will provide full ${serviceLabel} cleaning${propertyLabel}, including bathrooms, kitchen, floors, visible dust removal, and final touch-up cleaning throughout the property.${addOnSentence}${conditionSentence}`;
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
