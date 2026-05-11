import type { QuoteResult, WalkthroughJob } from "@/lib/walkthrough/types";

export type PropertyInsights = {
  jobDifficulty: string;
  supplyRequirements: string[];
  arrivalSetup: string[];
  crewConfiguration: string;
  timeOnSite: string;
  internalNotes: string[];
};

export function generatePropertyInsights(job: WalkthroughJob, quote: QuoteResult): PropertyInsights {
  const hasPressureWashing = job.selectedAddOnIds.includes("pressureWashing");
  const hasCarpet = job.selectedAddOnIds.includes("carpetExtraction");
  const hasOdor = job.selectedAddOnIds.includes("odorTreatment");
  const hasAppliances = job.selectedAddOnIds.includes("applianceDeepClean");
  const heavySections = Object.entries(job.checklist)
    .filter(([, item]) => item.condition === "Heavy")
    .map(([section]) => section);

  return {
    jobDifficulty: `${quote.difficultyRating} detail load with ${quote.pricingConfidence.toLowerCase()} pricing confidence`,
    supplyRequirements: [
      "Premium microfiber kit, neutral floor cleaner, stainless detail cloths",
      hasAppliances ? "Oven/fridge detailing kit and scraper-safe appliance tools" : "",
      hasCarpet ? "Carpet extractor, pre-spray, fans, and spot treatment" : "",
      hasPressureWashing ? "Pressure washing rig, surface cleaner, hose access plan" : "",
      hasOdor ? "Deodorizer, PPE, and ventilation plan" : "",
    ].filter(Boolean),
    arrivalSetup: [
      "Confirm parking, gate/access code, water and power availability",
      "Walk priority rooms first and capture before photos before moving supplies",
      job.property.occupancy === "Occupied"
        ? "Protect occupied areas and confirm rooms/items not included in scope"
        : "Stage team from entry and work top-down toward final exit path",
      job.property.turnaround === "Quick Turnaround"
        ? "Assign lead tech to final pass while crew completes detail zones"
        : "",
    ].filter(Boolean),
    crewConfiguration: `${quote.crewSize}-person crew recommended; assign one lead for scope control and final presentation pass`,
    timeOnSite: quote.estimatedDuration,
    internalNotes: [
      ...quote.internalNotes,
      heavySections.length > 0 ? `Heavy sections to verify: ${heavySections.join(", ")}.` : "",
    ].filter(Boolean),
  };
}
