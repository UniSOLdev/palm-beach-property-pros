export type LocationSlug =
  | "palm-beach"
  | "west-palm-beach"
  | "palm-beach-gardens"
  | "jupiter"
  | "wellington"
  | "lake-worth-beach";

export type LocationPage = {
  slug: LocationSlug;
  name: string;
  headline: string;
  intro: string;
  propertyTypes: string[];
  servicesAvailable: string[];
  nearbyAreas: string[];
  faq: { q: string; a: string }[];
};

export const LOCATION_PAGES: LocationPage[] = [
  {
    slug: "palm-beach",
    name: "Palm Beach",
    headline: "Property Cleaning & Care in Palm Beach",
    intro:
      "Palm Beach properties demand a higher standard—salt air, seasonal occupancy, and estate-scale exteriors all need dependable local crews. Palm Beach Property Pros provides window cleaning, pressure washing, residential and commercial cleaning, property care, and mobile detailing throughout the Town of Palm Beach and nearby barrier-island addresses.",
    propertyTypes: [
      "Waterfront estates and oceanfront homes",
      "Seasonal residences and winter estates",
      "Condo and co-op units with HOA access rules",
      "Boutique retail and professional offices on the island",
    ],
    servicesAvailable: [
      "Window cleaning (interior & exterior)",
      "Pressure washing & soft washing",
      "Residential deep & recurring cleaning",
      "Estate care & property cleanups",
      "Vacation-home checks",
      "Mobile detailing",
    ],
    nearbyAreas: ["West Palm Beach", "Palm Beach Gardens", "Lake Worth Beach", "North Palm Beach"],
    faq: [
      {
        q: "Do you work on Palm Beach island properties?",
        a: "Yes. We coordinate access, parking, and HOA or building entry requirements in advance so service stays efficient.",
      },
      {
        q: "Can you handle seasonal open-and-close cleaning?",
        a: "Yes. Many Palm Beach clients schedule deep cleans and exterior refreshes when opening or closing a seasonal residence.",
      },
      {
        q: "How do I get an estimate for a Palm Beach property?",
        a: "Share photos, your address or cross-street, and the services you need through our online estimate form. We follow up by call or text.",
      },
    ],
  },
  {
    slug: "west-palm-beach",
    name: "West Palm Beach",
    headline: "Cleaning & Property Services in West Palm Beach",
    intro:
      "From downtown condos to Northwood bungalows and waterfront homes along the Intracoastal, West Palm Beach properties face humidity, pollen, and year-round wear. We help homeowners, property managers, and business operators keep interiors clean, glass clear, and exteriors presentable—with one local team for multiple needs.",
    propertyTypes: [
      "Downtown condos and high-rises",
      "Historic district homes",
      "Retail storefronts and offices",
      "Short-term rentals and Airbnb units",
      "Small commercial suites",
    ],
    servicesAvailable: [
      "Residential & commercial cleaning",
      "Window cleaning",
      "Pressure washing",
      "Move-in / move-out cleaning",
      "Property maintenance coordination",
      "Mobile detailing",
    ],
    nearbyAreas: ["Palm Beach", "Riviera Beach", "Lake Worth Beach", "Palm Beach Gardens"],
    faq: [
      {
        q: "Do you serve downtown West Palm Beach?",
        a: "Yes. We work in downtown, Northwood, El Cid, Flamingo Park, and surrounding neighborhoods throughout the city.",
      },
      {
        q: "Can you clean commercial spaces after hours?",
        a: "When building access allows, we schedule after-hours commercial cleaning to avoid disrupting customers and staff.",
      },
      {
        q: "Do you offer recurring home cleaning in West Palm Beach?",
        a: "Yes. Weekly, biweekly, and monthly residential cleaning is available based on your home size and priorities.",
      },
    ],
  },
  {
    slug: "palm-beach-gardens",
    name: "Palm Beach Gardens",
    headline: "Home & Estate Cleaning in Palm Beach Gardens",
    intro:
      "Palm Beach Gardens combines golf-course communities, gated estates, and family neighborhoods—each with different cleaning and exterior-care needs. We provide window cleaning, pressure washing, residential cleaning, estate care, and vacation-home support with clear estimates and photo documentation.",
    propertyTypes: [
      "Gated communities and golf-course homes",
      "Estate properties with large lots",
      "Townhomes and patio homes",
      "Retail plazas and medical offices",
      "Vacation rentals near PGA Boulevard",
    ],
    servicesAvailable: [
      "Estate care & property cleanups",
      "Window cleaning",
      "Pressure washing & soft washing",
      "Residential deep cleaning",
      "Commercial cleaning",
      "Vacation-home checks",
    ],
    nearbyAreas: ["Jupiter", "North Palm Beach", "West Palm Beach", "Juno Beach"],
    faq: [
      {
        q: "Do you handle large estate cleanups in Palm Beach Gardens?",
        a: "Yes. We have completed full estate vegetation cleanups and exterior restoration projects in Palm Beach Gardens with documented before-and-after photos.",
      },
      {
        q: "Can you work inside gated communities?",
        a: "Yes. Provide gate codes, HOA requirements, and vendor registration details when you request an estimate.",
      },
      {
        q: "How often should windows be cleaned in Palm Beach Gardens?",
        a: "Many homes benefit from quarterly exterior glass service. We recommend a cadence after the first visit based on your exposure and preferences.",
      },
    ],
  },
  {
    slug: "jupiter",
    name: "Jupiter",
    headline: "Property Cleaning Services in Jupiter",
    intro:
      "Jupiter's coastal location means salt, sand, and humidity affect windows, driveways, and exterior finishes faster than inland properties. Palm Beach Property Pros serves Jupiter homeowners, seasonal residents, and commercial operators with dependable cleaning, pressure washing, and property care.",
    propertyTypes: [
      "Riverfront and Intracoastal homes",
      "Abacoa and Jupiter Farms residences",
      "Beach-area condos and townhomes",
      "Retail and restaurant storefronts",
      "Vacation rentals and seasonal homes",
    ],
    servicesAvailable: [
      "Window cleaning",
      "Pressure washing & soft washing",
      "Residential & commercial cleaning",
      "Move-in / move-out cleaning",
      "Property care & maintenance coordination",
      "Mobile detailing",
    ],
    nearbyAreas: ["Juno Beach", "Palm Beach Gardens", "Tequesta", "Hobe Sound"],
    faq: [
      {
        q: "Do you serve Abacoa and Jupiter Farms?",
        a: "Yes. We work throughout Jupiter, including Abacoa, Jupiter Farms, Lighthouse Point area, and nearby communities.",
      },
      {
        q: "Can you remove salt and algae from driveways?",
        a: "Yes. We evaluate the surface and use pressure or soft washing with pretreatment where needed.",
      },
      {
        q: "Do you clean vacation rentals in Jupiter?",
        a: "Yes. Turnover cleaning and vacation-home checks are available for short-term rental operators.",
      },
    ],
  },
  {
    slug: "wellington",
    name: "Wellington",
    headline: "Residential & Estate Cleaning in Wellington",
    intro:
      "Wellington's equestrian estates, family neighborhoods, and village retail all need reliable property care—especially during season when homes see more guests and events. We provide interior cleaning, window service, pressure washing, and estate support tailored to Wellington properties.",
    propertyTypes: [
      "Equestrian estates and large-lot homes",
      "Polo and golf-community residences",
      "Family neighborhoods and townhomes",
      "Village retail and office spaces",
      "Seasonal homes during Wellington season",
    ],
    servicesAvailable: [
      "Residential deep & recurring cleaning",
      "Estate care & property cleanups",
      "Window cleaning",
      "Pressure washing",
      "Move-in / move-out cleaning",
      "Mobile detailing",
    ],
    nearbyAreas: ["Royal Palm Beach", "Loxahatchee", "Greenacres", "Lake Worth Beach"],
    faq: [
      {
        q: "Do you clean large Wellington estates?",
        a: "Yes. We scope estate cleaning and exterior care by square footage, room count, and condition—photos help us quote accurately.",
      },
      {
        q: "Can you coordinate around Wellington season schedules?",
        a: "Yes. Many clients schedule deep cleans before events, season arrival, or guest visits. Share your timing when requesting an estimate.",
      },
      {
        q: "Do you pressure wash barns and exterior structures?",
        a: "Exterior pressure and soft washing is available by scope. Share photos of the surfaces you need cleaned for an accurate estimate.",
      },
    ],
  },
  {
    slug: "lake-worth-beach",
    name: "Lake Worth Beach",
    headline: "Cleaning & Exterior Care in Lake Worth Beach",
    intro:
      "Lake Worth Beach blends historic neighborhoods, beach-area condos, and a vibrant downtown—each with distinct cleaning needs. From salt-streaked windows to storefront floors and rental turnovers, we provide local crews who understand coastal wear and tight scheduling.",
    propertyTypes: [
      "Historic district homes and cottages",
      "Beach-area condos and apartments",
      "Downtown retail and restaurants",
      "Short-term rentals near the beach",
      "Small office and commercial suites",
    ],
    servicesAvailable: [
      "Residential & commercial cleaning",
      "Window cleaning",
      "Pressure washing",
      "Move-in / move-out cleaning",
      "Vacation-home checks",
      "Mobile detailing",
    ],
    nearbyAreas: ["Lantana", "Boynton Beach", "West Palm Beach", "Hypoluxo"],
    faq: [
      {
        q: "Do you serve the Lake Worth Beach downtown area?",
        a: "Yes. We work in downtown, the beach corridor, historic neighborhoods, and surrounding Lake Worth Beach communities.",
      },
      {
        q: "Can you handle Airbnb turnovers near the beach?",
        a: "Yes. Turnover cleaning aligned to check-in windows is available for short-term rental operators.",
      },
      {
        q: "How do salt and humidity affect cleaning schedules?",
        a: "Coastal properties often need more frequent exterior glass and hardscape cleaning. We recommend a cadence after assessing your property.",
      },
    ],
  },
];

export function getLocationBySlug(slug: string): LocationPage | undefined {
  return LOCATION_PAGES.find((l) => l.slug === slug);
}

export function getAllLocationSlugs(): LocationSlug[] {
  return LOCATION_PAGES.map((l) => l.slug);
}

/** Primary location pages linked from footer and service area. */
export const PRIMARY_LOCATION_SLUGS: LocationSlug[] = [
  "palm-beach",
  "west-palm-beach",
  "palm-beach-gardens",
  "jupiter",
  "wellington",
  "lake-worth-beach",
];
