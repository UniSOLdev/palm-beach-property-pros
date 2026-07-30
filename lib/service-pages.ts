import { serviceLocationSeoParagraphs } from "@/lib/location-seo";
import { getServiceBySlug, SERVICES, type ServiceSlug } from "@/lib/services";
import type { ServicePageContent } from "@/components/marketing/service-page-template";

/** Flat URL slugs mapped to service definitions or custom content. */
export type FlatServiceSlug =
  | "window-cleaning"
  | "pressure-washing"
  | "residential-cleaning"
  | "commercial-cleaning"
  | "property-care"
  | "vacation-home-checks"
  | "recurring-lawn-driveway"
  | "mobile-detailing";

const SLUG_TO_SERVICE: Partial<Record<FlatServiceSlug, ServiceSlug>> = {
  "window-cleaning": "window-cleaning",
  "pressure-washing": "pressure-washing",
  "residential-cleaning": "residential-cleaning",
  "commercial-cleaning": "commercial-cleaning",
  "property-care": "property-maintenance",
  "recurring-lawn-driveway": "recurring-lawn-driveway",
  "mobile-detailing": "auto-detailing",
};

const RELATED_BY_SLUG: Partial<Record<FlatServiceSlug, FlatServiceSlug[]>> = {
  "window-cleaning": ["pressure-washing", "residential-cleaning", "commercial-cleaning"],
  "pressure-washing": ["recurring-lawn-driveway", "window-cleaning", "property-care"],
  "recurring-lawn-driveway": ["pressure-washing", "property-care", "residential-cleaning"],
  "residential-cleaning": ["commercial-cleaning", "property-care", "window-cleaning"],
  "commercial-cleaning": ["residential-cleaning", "window-cleaning", "property-care"],
  "property-care": ["vacation-home-checks", "residential-cleaning", "pressure-washing"],
  "vacation-home-checks": ["property-care", "residential-cleaning", "commercial-cleaning"],
  "mobile-detailing": ["residential-cleaning", "pressure-washing"],
};

function benefitsFromService(name: string): string[] {
  return [
    `Clear estimates with photos before work begins`,
    `Reliable scheduling and service updates`,
    `Local Palm Beach County experience with ${name.toLowerCase()}`,
    `Before-and-after documentation when helpful`,
  ];
}

const RELATED_LABELS: Record<FlatServiceSlug, string> = {
  "window-cleaning": "Window Cleaning",
  "pressure-washing": "Pressure Washing & Soft Washing",
  "residential-cleaning": "Residential Cleaning",
  "commercial-cleaning": "Commercial Cleaning",
  "property-care": "Property & Estate Care",
  "vacation-home-checks": "Vacation Home Checks",
  "recurring-lawn-driveway": "Recurring Lawn & Driveway Maintenance",
  "mobile-detailing": "Mobile Detailing",
};

function relatedLinksFor(slug: FlatServiceSlug) {
  return (RELATED_BY_SLUG[slug] ?? []).map((s) => ({
    href: `/${s}`,
    label: RELATED_LABELS[s],
  }));
}

function toServicePageContent(
  slug: FlatServiceSlug,
  overrides: Partial<ServicePageContent> & Pick<ServicePageContent, "slug" | "name" | "headline" | "intro">,
): ServicePageContent {
  const serviceSlug = SLUG_TO_SERVICE[slug];
  const base = serviceSlug ? getServiceBySlug(serviceSlug) : undefined;

  return {
    slug,
    name: overrides.name,
    headline: overrides.headline,
    intro: overrides.intro,
    benefits: overrides.benefits ?? benefitsFromService(overrides.name),
    included: overrides.included ?? base?.included ?? [],
    whoItsFor: overrides.whoItsFor ?? base?.whoItsFor ?? [],
    process: overrides.process ?? base?.process,
    faq: overrides.faq ?? base?.faq ?? [],
    startingPriceLabel: overrides.startingPriceLabel ?? base?.startingPriceLabel,
    locationParagraphs:
      overrides.locationParagraphs ??
      serviceLocationSeoParagraphs(overrides.name, overrides.slug),
    relatedLinks: overrides.relatedLinks ?? relatedLinksFor(slug),
  };
}

const CUSTOM_PAGES: Record<FlatServiceSlug, ServicePageContent> = {
  "window-cleaning": toServicePageContent("window-cleaning", {
    slug: "window-cleaning",
    name: "Window Cleaning",
    headline: "Window Cleaning in Palm Beach County",
    intro:
      "Professional window cleaning improves light, curb appeal, and first impressions. Our crews work on residential and commercial glass throughout Palm Beach County—with clear estimates and reliable scheduling.",
  }),
  "pressure-washing": toServicePageContent("pressure-washing", {
    slug: "pressure-washing",
    name: "Pressure Washing & Soft Washing",
    headline: "Pressure Washing & Soft Washing in Palm Beach County",
    intro:
      "Walkways, driveways, siding, and pool decks cleaned with the right pressure for each surface. We evaluate substrate type and staining before choosing pressure washing or soft washing.",
  }),
  "residential-cleaning": toServicePageContent("residential-cleaning", {
    slug: "residential-cleaning",
    name: "Residential Cleaning",
    headline: "Residential Cleaning in Palm Beach County",
    intro:
      "Recurring home cleaning, deep cleans, and move-in or move-out service on a schedule that fits your household. Kitchens, baths, floors, and priority rooms handled with consistent standards.",
  }),
  "commercial-cleaning": toServicePageContent("commercial-cleaning", {
    slug: "commercial-cleaning",
    name: "Commercial Cleaning",
    headline: "Commercial Cleaning in Palm Beach County",
    intro:
      "Customer-ready floors, restrooms, and touchpoints—commercial cleaning aligned to your operating hours and foot traffic. We build scopes around your space, not a generic checklist.",
  }),
  "property-care": toServicePageContent("property-care", {
    slug: "property-care",
    name: "Property & Estate Care",
    headline: "Property & Estate Care in Palm Beach County",
    intro:
      "Estate upkeep, property cleanups, and dependable coordination for seasonal homes, rentals, and larger properties. One local team for cleaning, exterior care, and light maintenance coordination.",
    benefits: [
      "One team for multiple property needs",
      "Before-and-after photos for estate and cleanup projects",
      "Reliable scheduling for seasonal and off-site owners",
      "Clear scope and estimates before work begins",
    ],
    included: [
      "Estate and property cleanups by agreed scope",
      "Exterior line restoration and debris removal",
      "Coordination with cleaning and turnover schedules",
      "Photo documentation for owners and managers",
      "Light maintenance and punch-list items when scoped",
    ],
    whoItsFor: [
      "Estate owners and seasonal residents",
      "Property managers with multiple units",
      "Vacation-home owners between guest stays",
      "HOA and community common-area projects",
    ],
    faq: [
      {
        q: "What types of property care do you handle?",
        a: "Estate cleanups, vegetation clearing, exterior resets, and coordination with interior cleaning—scoped in advance with photos and a written estimate.",
      },
      {
        q: "Can you care for a property while I am away?",
        a: "Yes. Vacation-home checks and scheduled visits are available for seasonal and second-home owners.",
      },
      {
        q: "Do you coordinate with other vendors?",
        a: "We can align timing with cleaners, landscapers, and managers when you need multiple services sequenced.",
      },
      {
        q: "How do I request an estate or cleanup estimate?",
        a: "Share photos of the property, access notes, and your timeline through our online estimate form.",
      },
    ],
    startingPriceLabel:
      "Property care is quoted by scope after photos or a walkthrough. Estate cleanups and larger projects receive itemized estimates.",
  }),
  "vacation-home-checks": toServicePageContent("vacation-home-checks", {
    slug: "vacation-home-checks",
    name: "Vacation Home Checks",
    headline: "Vacation Home Checks in Palm Beach County",
    intro:
      "Scheduled visits while you are away—interior walkthroughs, exterior checks, and coordination so your Palm Beach County property stays secure, clean, and guest-ready.",
    benefits: [
      "Peace of mind for off-site and seasonal owners",
      "Photo updates from each visit when requested",
      "Coordination with cleaning and maintenance",
      "Local team familiar with Palm Beach County properties",
    ],
    included: [
      "Scheduled property walkthroughs",
      "Interior and exterior condition checks",
      "Basic issue identification and owner notification",
      "Coordination with cleaning before guest arrival",
      "Photo documentation when included in scope",
    ],
    whoItsFor: [
      "Seasonal Palm Beach residents",
      "Second-home and vacation-property owners",
      "Remote owners with local rental or guest use",
      "Property managers needing backup visit coverage",
    ],
    process: [
      "Request service — share property address, access instructions, and visit frequency.",
      "Scope & schedule — we confirm what each visit includes and set a reliable cadence.",
      "Visit day — our team walks the property and documents conditions.",
      "Owner update — you receive notes and photos when issues or changes need attention.",
    ],
    faq: [
      {
        q: "What happens during a vacation-home check?",
        a: "We walk interior and exterior areas per your checklist—checking for leaks, pests, storm damage, and general condition—and notify you of anything that needs attention.",
      },
      {
        q: "Can checks include light cleaning?",
        a: "Yes. Dusting, glass touch-ups, and arrival prep can be bundled into the visit scope.",
      },
      {
        q: "How often should checks be scheduled?",
        a: "Weekly, biweekly, or monthly visits are common for seasonal homes. We recommend a cadence based on your property and how often it is occupied.",
      },
      {
        q: "Do you handle emergency issues?",
        a: "We notify owners promptly when we find problems. Emergency repair coordination depends on scope—confirm your preferences when setting up service.",
      },
    ],
    startingPriceLabel:
      "Vacation-home checks are quoted by visit frequency and scope. Share your property details for a clear estimate.",
    locationParagraphs: serviceLocationSeoParagraphs("vacation home checks"),
  }),
  "recurring-lawn-driveway": toServicePageContent("recurring-lawn-driveway", {
    slug: "recurring-lawn-driveway",
    name: "Recurring Lawn & Driveway Maintenance",
    headline: "Recurring Lawn & Driveway Maintenance in Palm Beach County",
    intro:
      "Our proven recurring program keeps lawns edged, driveways clear, and exterior approaches presentable on a dependable schedule—typically around $300 per visit for properties within agreed scope.",
    benefits: [
      "Proven recurring program with steady monthly or biweekly visits",
      "One crew for lawn edging, blow-down, and driveway maintenance",
      "Clear scope and pricing before the first cycle",
      "Easy to pair with pressure washing or property care",
    ],
    relatedLinks: relatedLinksFor("recurring-lawn-driveway"),
  }),
  "mobile-detailing": toServicePageContent("mobile-detailing", {
    slug: "mobile-detailing",
    name: "Mobile Detailing",
    headline: "Professional Mobile Detailing at Your Home or Workplace",
    intro:
      "Palm Beach Property Pros Mobile Detailing brings interior, exterior, and full details to your driveway, garage, or workplace—SUVs, trucks, and daily drivers throughout Palm Beach County.",
    benefits: [
      "Mobile service at your location",
      "Interior, exterior, and full detail packages",
      "Clear estimates before your appointment",
      "Suitable for SUVs, trucks, and daily drivers",
    ],
    included: [
      "Interior vacuum, wipe-down, and glass",
      "Exterior wash, wheels, and tire dressing by package",
      "Full details combining interior and exterior care",
      "Maintenance details for regular upkeep",
      "Leather conditioning and odor treatment when selected",
    ],
    whoItsFor: [
      "Homeowners who want detailing without visiting a shop",
      "Busy professionals at home or office locations",
      "Families with SUVs and trucks",
      "Small business fleets needing mobile service",
    ],
    faq: [
      {
        q: "Where do you perform mobile detailing?",
        a: "At your home, workplace, or another agreed location in Palm Beach County. Share your address when requesting an estimate so we can confirm access and setup.",
      },
      {
        q: "What should I do before my detail appointment?",
        a: "Remove personal items from the cabin and trunk. Note any problem areas, pet hair, or stains in your request so we can plan enough time.",
      },
      {
        q: "How long does a detail take?",
        a: "Timing depends on vehicle size, package, and condition. We provide an expected window when we confirm your appointment.",
      },
      {
        q: "Do you detail trucks and SUVs?",
        a: "Yes. We service daily drivers, SUVs, and trucks. Larger vehicles may require additional time—photos help us quote accurately.",
      },
    ],
    startingPriceLabel:
      "Most mobile details range from $200–$400 depending on vehicle size, condition, and selected services.",
    locationParagraphs: serviceLocationSeoParagraphs("mobile detailing"),
  }),
};

export function getFlatServicePage(slug: string): ServicePageContent | undefined {
  return CUSTOM_PAGES[slug as FlatServiceSlug];
}

export function getAllFlatServiceSlugs(): FlatServiceSlug[] {
  return Object.keys(CUSTOM_PAGES) as FlatServiceSlug[];
}

/** Legacy /services/* slugs that redirect to flat URLs. */
export function getLegacyServiceRedirect(slug: string): string | undefined {
  const map: Record<string, FlatServiceSlug> = {
    "window-cleaning": "window-cleaning",
    "pressure-washing": "pressure-washing",
    "residential-cleaning": "residential-cleaning",
    "commercial-cleaning": "commercial-cleaning",
    "property-maintenance": "property-care",
    "recurring-lawn-driveway": "recurring-lawn-driveway",
    "auto-detailing": "mobile-detailing",
    "airbnb-services": "vacation-home-checks",
  };
  const target = map[slug];
  return target ? `/${target}` : undefined;
}

/** Public href for a service — flat URL when available, otherwise /services/[slug]. */
export function getServicePublicHref(slug: string): string {
  const flat = getLegacyServiceRedirect(slug);
  return flat ?? `/services/${slug}`;
}

export { SERVICES };
