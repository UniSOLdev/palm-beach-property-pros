/**
 * Public-site copy for the home watch & member-services positioning.
 *
 * Edit wording here — every page (home, /services, /services/[slug], /quote,
 * schema.org JSON-LD) reads from this one file.
 *
 * RULES (brand = discretion):
 *  - Never list prices. Every service ends in "Call for a private quote" / "Request a quote".
 *  - Never name a club, community, gate, street, or client.
 */

export type ServiceArea = {
  slug: string;
  name: string;
  blurb: string;
};

export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: "palm-beach-gardens",
    name: "Palm Beach Gardens",
    blurb:
      "Club and golf communities, gated neighborhoods, and seasonal homes throughout the Gardens.",
  },
  {
    slug: "jupiter",
    name: "Jupiter",
    blurb:
      "Waterfront and Intracoastal homes, Jupiter Island approaches, and inland communities.",
  },
  {
    slug: "north-palm-beach",
    name: "North Palm Beach",
    blurb: "Waterway homes, condominiums, and village neighborhoods along U.S. 1.",
  },
  {
    slug: "palm-beach",
    name: "Palm Beach",
    blurb: "Island residences and estates, with the discretion the island expects.",
  },
];

export const AREA_NAMES = SERVICE_AREAS.map((a) => a.name);

export type Service = {
  slug: string;
  name: string;
  short: string;
  /** One-paragraph summary for cards. */
  summary: string;
  /** Detail-page intro. */
  intro: string;
  includes: string[];
  idealFor: string;
  seoTitle: string;
  seoDescription: string;
};

export const SERVICES: Service[] = [
  {
    slug: "home-watch",
    name: "Home Watch",
    short: "Scheduled visual inspections while you are away, with a photo report after every visit.",
    summary:
      "Regular, documented visits to your home while you are away — inside and out — so small issues never become expensive surprises.",
    intro:
      "A home that sits empty in South Florida needs attention. Humidity, storms, irrigation, pests, and power interruptions don't wait for your return. We visit on a schedule that suits your home, walk it with a checklist built for it, and send a dated photo report after every visit.",
    includes: [
      "Interior and exterior walk-through on a set schedule",
      "Check for leaks, moisture, mold, and pest activity",
      "Run faucets, flush toilets, and check water heater and A/C condensate lines",
      "Confirm thermostat and humidity settings",
      "Check doors, windows, locks, and alarm status",
      "Collect packages and remove door hangers",
      "Dated photo report after every visit",
      "Same-day call if anything needs your attention",
    ],
    idealFor: "Seasonal residents and owners who travel for weeks at a time.",
    seoTitle: "Home Watch Services in Palm Beach Gardens & Jupiter",
    seoDescription:
      "Discreet, scheduled home watch inspections for seasonal residents in Palm Beach Gardens, Jupiter, North Palm Beach, and Palm Beach. Photo report after every visit. Call for a private quote.",
  },
  {
    slug: "arrival-departure",
    name: "Arrival & Departure Prep",
    short: "Your home opened, aired out, and stocked before you land — and closed properly when you leave.",
    summary:
      "We open the house before you arrive and close it carefully when you leave, so the first and last day of your season are calm ones.",
    intro:
      "Arriving to a stuffy house and an empty refrigerator is no way to start the season. Before you arrive we open, air, and check the home, set the temperature, and stock the basics. When you leave, we close it down to a checklist you approve — so it's ready for the months ahead.",
    includes: [
      "A/C set to your arrival temperature ahead of time",
      "Lights, water, and appliances checked and on",
      "Groceries, flowers, and essentials stocked to your list",
      "Outdoor furniture and cushions set out or stored",
      "Vehicles started, charged, or brought around",
      "Departure close-down: water, thermostat, humidity, and storm readiness",
      "Coordination with your cleaners, pool, and landscape teams",
    ],
    idealFor: "Snowbirds, frequent travelers, and second-home owners.",
    seoTitle: "Seasonal Home Opening & Closing in the Palm Beaches",
    seoDescription:
      "Arrival and departure home preparation for seasonal residents in Palm Beach Gardens, Jupiter, and Palm Beach. Opened, stocked, and closed properly. Request a private quote.",
  },
  {
    slug: "hurricane-prep",
    name: "Hurricane Preparation",
    short: "Storm readiness before the season, action when a storm turns your way, and a report after it passes.",
    summary:
      "A written storm plan for your home, prep when a storm is forecast, and a post-storm inspection with photos — whether or not you're in town.",
    intro:
      "When a storm is forecast, contractors are booked and owners who are out of state can only watch. We put a written plan in place for your home before the season, carry it out when a storm turns toward us, and inspect and report as soon as it is safe.",
    includes: [
      "Pre-season walk-through and written storm plan for your home",
      "Shutter and impact-panel deployment coordination",
      "Outdoor furniture, planters, and loose items secured",
      "Generator check and fuel coordination",
      "Photo documentation before the storm for insurance",
      "Post-storm inspection and report as soon as it is safe",
      "Coordination of emergency repairs and mitigation vendors",
    ],
    idealFor: "Every South Florida home, especially when the owner is away from June to November.",
    seoTitle: "Hurricane Preparation for Palm Beach Homes",
    seoDescription:
      "Hurricane prep and post-storm inspections for homes in Palm Beach Gardens, Jupiter, North Palm Beach, and Palm Beach. Written storm plan and photo reports. Call for a private quote.",
  },
  {
    slug: "handyman",
    name: "Handyman & Small Repairs",
    short: "The small list that never gets done — handled carefully, by someone you already trust in your home.",
    summary:
      "Light repairs, adjustments, and installations by the same trusted person who already knows your home.",
    intro:
      "Every home collects a list: a sticking door, a dead bulb at the top of the stairs, a picture to hang, a filter to change. We handle the small items carefully and tidily. For anything that requires a licensed trade, we bring in the right licensed professional and oversee the work.",
    includes: [
      "Light fixtures, bulbs, and battery replacements",
      "Door, cabinet, and hardware adjustments",
      "Picture, mirror, and shelf hanging",
      "A/C filter changes and caulking touch-ups",
      "Furniture assembly and small installations",
      "Seasonal touch-ups before guests arrive",
      "Licensed trades arranged and supervised when required",
    ],
    idealFor: "Owners who want small jobs done right without managing them.",
    seoTitle: "Handyman & Small Home Repairs in Palm Beach Gardens",
    seoDescription:
      "Careful handyman help and small repairs for homes in Palm Beach Gardens, Jupiter, and the Palm Beaches. Licensed trades arranged when required. Request a private quote.",
  },
  {
    slug: "vendor-coordination",
    name: "Vendor Coordination",
    short: "One trusted point of contact for your pool, landscape, cleaning, and repair professionals.",
    summary:
      "We meet your vendors, let them in, check the work, and keep you informed — so you have one call to make, not ten.",
    intro:
      "Running a home from out of town means a stream of calls: the pool company, the A/C technician, the cleaners, the window team. We become your single point of contact — scheduling, letting vendors in, staying while they work, and confirming the job was done before anyone is paid.",
    includes: [
      "Scheduling and meeting vendors at your home",
      "On-site oversight while work is performed",
      "Quality check and photos when work is complete",
      "Collecting and comparing estimates on request",
      "Seasonal exterior care: windows, pressure washing, and detailing",
      "A running log of every vendor visit",
    ],
    idealFor: "Owners who want their home run like a well-managed property.",
    seoTitle: "Home Vendor Coordination for Palm Beach Homeowners",
    seoDescription:
      "One trusted point of contact for pool, landscape, cleaning, and repair vendors at your Palm Beach Gardens or Jupiter home. Request a private quote.",
  },
  {
    slug: "concierge",
    name: "Concierge & Errands",
    short: "Deliveries received, errands run, and the details handled — quietly and promptly.",
    summary:
      "Package receiving, errands, deliveries, and the small favors that make life at home easier.",
    intro:
      "Some requests don't fit a category: a delivery that needs someone home, a gift to pick up, a car to take for service, a guest who needs to be let in. We handle them promptly and quietly, and let you know when it's done.",
    includes: [
      "Receiving deliveries and inspecting them on arrival",
      "Errands, pickups, and drop-offs",
      "Vehicle service runs",
      "Letting in guests, family, and service providers",
      "Mail handling and forwarding",
      "Holiday and event setup help",
    ],
    idealFor: "Busy households and owners who are often away.",
    seoTitle: "Residential Concierge & Errand Services in the Palm Beaches",
    seoDescription:
      "Discreet residential concierge, errands, and delivery receiving for homes in Palm Beach Gardens, Jupiter, North Palm Beach, and Palm Beach. Call for a private quote.",
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export const HOW_IT_WORKS = [
  {
    title: "A private consultation",
    body: "We talk by phone, then walk your home with you or your representative. We learn how you live, what matters most, and how you like to be kept informed.",
  },
  {
    title: "A plan for your home",
    body: "You receive a written plan — visit schedule, checklist, access, and contacts — tailored to your home and your calendar. No packages you don't need.",
  },
  {
    title: "Regular check-ins & photo reports",
    body: "After every visit you receive a dated photo report. If something needs attention, you hear from us the same day, with options — never surprises.",
  },
] as const;

/**
 * PLACEHOLDER testimonials — replace with real client quotes (first name +
 * area only, with written permission). Keep `placeholder: true` until then;
 * the site shows a small "sample" label on each card while it's true.
 */
export const TESTIMONIALS = [
  {
    quote:
      "We spend summers up north and used to worry the whole time. Now a report with photos arrives after every visit, and when a storm came through we knew within hours that the house was fine.",
    name: "Margaret",
    area: "Palm Beach Gardens",
    placeholder: true,
  },
  {
    quote:
      "The house is cool, the refrigerator is stocked, and the cushions are out when we walk in. It's the first thing that feels like home after the flight.",
    name: "Richard",
    area: "Jupiter",
    placeholder: true,
  },
  {
    quote:
      "One phone call and everything is handled — the pool company, the A/C service, the window cleaners. Quiet, punctual, and completely trustworthy.",
    name: "Susan",
    area: "North Palm Beach",
    placeholder: true,
  },
] as const;

export type FaqItem = { question: string; answer: string };

export const FAQS: FaqItem[] = [
  {
    // CONFIRM before production: coverage types and limits must match your actual policy.
    question: "Are you insured?",
    answer:
      "Yes. Palm Beach Property Pros carries general liability insurance, and we're happy to provide a certificate of insurance before any work begins. Work that requires a licensed trade — electrical, plumbing, roofing, or structural — is always performed by appropriately licensed and insured professionals we coordinate and supervise.",
  },
  {
    question: "How do you handle keys, codes, and access?",
    answer:
      "Keys are coded and stored securely — never labeled with your name or address. Alarm and gate codes are kept private and shared with no one without your permission. We can work with your gatehouse, alarm company, and smart locks, and every entry is logged in your visit report.",
  },
  {
    question: "What do the reports look like?",
    answer:
      "After every visit you receive a short report by email or text: the date and time, what was checked, and photos of the key areas of your home. Anything that needs attention is flagged at the top with our recommendation, so you can decide in a minute.",
  },
  {
    question: "What happens during a hurricane?",
    answer:
      "Before the season we agree on a written storm plan for your home. When a storm is forecast, we carry it out — securing outdoor items, coordinating shutters, and photographing the home for insurance. As soon as it is safe after the storm, we inspect and send you a full report.",
  },
  {
    question: "What happens while I'm away?",
    answer:
      "Your home is visited on the schedule we agree on, with a report after each visit. If something comes up — a leak, a power outage, a delivery, a vendor who needs to be let in — you have one person to call, and we handle it and let you know when it's done.",
  },
  {
    question: "Why don't you list prices?",
    answer:
      "Every home and every owner's needs are different, so we quote privately after a short conversation. Call us or send a request and you'll receive a clear, written quote with no obligation.",
  },
];
