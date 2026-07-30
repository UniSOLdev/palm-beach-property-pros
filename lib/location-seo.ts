/** Local SEO blocks for flat service pages — unique copy per service slug. */

const SERVICE_LOCATION_SEO: Record<string, readonly [string, string, string]> = {
  "window-cleaning": [
    "Palm Beach Property Pros provides window cleaning across Palm Beach County—from waterfront estates on the island to downtown West Palm Beach high-rises and Jupiter coastal homes. We work on interior and exterior glass where safely accessible, with scope matched to height, salt exposure, and finish type.",
    "Coastal salt, pollen, and irrigation overspray mean glass here often needs a steadier cadence than inland markets. We plan each visit around access, HOA rules, and whether screens, tracks, or specialty coatings are included in your scope.",
    "Request a photo-based estimate at palmbeachpropertypros.com/quote. Include each elevation or storefront run—we respond with clear pricing direction and scheduling options.",
  ],
  "pressure-washing": [
    "Pressure washing and soft washing from Palm Beach Property Pros cover driveways, pool decks, patios, walkways, and exterior siding throughout Palm Beach County. We choose pressure or soft washing based on substrate—not every surface can handle the same treatment.",
    "Algae, mildew, and ground-in grime return quickly in our humidity. Pretreatment and technique matter as much as equipment, especially near landscaping, pool cages, and painted or stucco finishes.",
    "Share photos of the areas you want refreshed through our online estimate form. We confirm water access, drainage, and timing before scheduling your visit.",
  ],
  "residential-cleaning": [
    "Residential cleaning from Palm Beach Property Pros serves single-family homes, condos, townhomes, and seasonal residences across West Palm Beach, Palm Beach Gardens, Jupiter, Wellington, and nearby communities.",
    "We tailor recurring and deep-clean visits to your priorities—kitchens, baths, floors, and the rooms that matter most—rather than forcing a generic checklist. Many clients pair interior cleaning with window or exterior work through one local team.",
    "Start with photos, approximate square footage, and your preferred frequency at palmbeachpropertypros.com/quote. We follow up by call or text with scope and pricing before the first visit.",
  ],
  "commercial-cleaning": [
    "Commercial cleaning for Palm Beach County retail, offices, showrooms, and light industrial storefronts—scheduled around your hours and foot traffic. Palm Beach Property Pros builds scopes around restrooms, floors, glass, and high-touch surfaces your customers actually notice.",
    "We coordinate with property managers, onsite staff, and landlord access requirements so after-hours or opening-window service stays predictable. Photo estimates and short walkthroughs help keep recurring accounts accurate as seasons change.",
    "Submit your square footage, service frequency, and priority areas through our quote form. We return a clear proposal before work begins.",
  ],
  "property-care": [
    "Property and estate care from Palm Beach Property Pros supports larger homes, seasonal estates, rentals, and managed portfolios across Palm Beach County—cleanup days, exterior resets, and coordination with interior cleaning or turnover schedules.",
    "Off-site and seasonal owners often need one accountable local team for walkthroughs, debris removal, vegetation clearing, and presentation before guests or family arrive. We document conditions with photos when helpful.",
    "Estate and cleanup projects are quoted from photos and access notes. Request an estimate at palmbeachpropertypros.com/quote with property address, timing, and any manager contacts.",
  ],
  "vacation-home-checks": [
    "Vacation-home checks from Palm Beach Property Pros give seasonal and second-home owners scheduled walkthroughs while they are away—interior and exterior condition reviews across Palm Beach, Jupiter, Wellington, and West Palm Beach.",
    "Checks can include light cleaning touch-ups, storm or leak awareness, and coordination before guest arrival. Frequency is set to your property—weekly, biweekly, or monthly depending on exposure and occupancy.",
    "Share access instructions, your checklist, and preferred cadence through our estimate form. We confirm what each visit includes before the first walkthrough.",
  ],
  "recurring-lawn-driveway": [
    "Recurring lawn and driveway maintenance is one of our most established programs in Palm Beach County—scheduled edging, blow-down, and driveway or walkway upkeep that keeps curb appeal steady between deeper exterior projects.",
    "Homeowners, HOAs, and property managers use this service to avoid stacking vendors for routine exterior presentation. Visits are typically monthly or biweekly at around $300 within agreed scope, depending on property size.",
    "Request recurring service through palmbeachpropertypros.com/quote with photos of the lawn, driveway, and access points. We confirm water and power availability before scheduling.",
  ],
  "mobile-detailing": [
    "Mobile detailing from Palm Beach Property Pros comes to your home, workplace, or agreed location across Palm Beach County—interior, exterior, and full details for SUVs, trucks, and daily drivers.",
    "Most details fall in the $200–$400 range depending on vehicle size, soil level, and package. We confirm access, shade, and water or power availability when scheduling mobile appointments.",
    "Send interior and exterior photos with your vehicle type through our quote form for the fastest accurate estimate.",
  ],
};

function genericParagraphs(serviceName: string): string[] {
  return [
    `Palm Beach Property Pros provides ${serviceName} across Palm Beach County. We routinely work in West Palm Beach, Palm Beach Gardens, Jupiter, Riviera Beach, Lake Worth, Boynton Beach, Delray Beach, North Palm Beach, and Juno Beach, along with nearby communities.`,
    `Coastal humidity, pollen cycles, and salt exposure affect how finishes age in this region. We plan each visit around surface type, access, and your scheduling priorities—not a one-size-fits-all checklist.`,
    `Submit a quote request at palmbeachpropertypros.com/quote with photos and property details. We respond with clear scope, pricing direction, and next available dates.`,
  ];
}

/** 2–3 paragraph local SEO block for service detail pages. */
export function serviceLocationSeoParagraphs(serviceName: string, slug?: string): string[] {
  if (slug && SERVICE_LOCATION_SEO[slug]) {
    return [...SERVICE_LOCATION_SEO[slug]];
  }
  return genericParagraphs(serviceName);
}
