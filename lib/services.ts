export type ServiceSlug =
  | "window-cleaning"
  | "residential-cleaning"
  | "commercial-cleaning"
  | "pressure-washing"
  | "auto-detailing"
  | "carpet-steam-cleaning"
  | "trash-can-cleaning"
  | "property-maintenance"
  | "airbnb-services"
  | "restaurant-hospitality-cleaning"
  | "move-in-move-out-relocation";

export type ServiceDefinition = {
  slug: ServiceSlug;
  anchor: string;
  name: string;
  /** Benefit-led blurb for cards and meta. */
  shortDescription: string;
  bestFor: string;
  headline: string;
  authorityIntro: string;
  included: string[];
  whoItsFor: string[];
  /** Optional override; defaults to standard four-step process. */
  process?: readonly string[];
  startingPriceLabel: string;
  faq: readonly { q: string; a: string }[];
};

export const SERVICES: ServiceDefinition[] = [
  {
    slug: "window-cleaning",
    anchor: "window-cleaning",
    name: "Window Cleaning",
    shortDescription:
      "Clear glass that sells curb appeal—interior and exterior panes cleaned with care for frames, screens, and finishes.",
    bestFor: "Water-view homes, storefronts, offices, and entries with heavy sun and salt exposure.",
    headline: "Window Cleaning in Palm Beach County",
    authorityIntro:
      "Professional window cleaning improves light, appearance, and first impressions. Our crews work methodically on residential and commercial glass throughout Palm Beach County, with scope matched to height, access, and finish type.",
    included: [
      "Interior and exterior glass where safely accessible",
      "Screens and tracks when included in agreed scope",
      "Floor and sill protection during service",
      "Finish-safe products selected for coastal residue",
    ],
    whoItsFor: [
      "Homeowners who want clarity without ladder risk",
      "Retail and office entrances that need a consistent polish",
      "Property managers scheduling recurring glass care",
    ],
    startingPriceLabel: "Window cleaning projects often start around $99 depending on pane count, height, and access.",
    faq: [
      {
        q: "Do you clean both interior and exterior glass?",
        a: "Yes, when access and safety allow. We confirm height, ladder requirements, and any HOA rules before scheduling.",
      },
      {
        q: "How often should windows be cleaned in Palm Beach County?",
        a: "Many coastal homes benefit from quarterly exterior service and interior service aligned to season or events. We recommend a cadence after the first visit based on exposure.",
      },
      {
        q: "Can you work around HOA or building access rules?",
        a: "We coordinate entry instructions, water access, and parking in advance so the visit stays efficient for onsite staff and residents.",
      },
      {
        q: "What is the fastest way to get pricing?",
        a: "Send photos of each elevation and note approximate pane counts through our quick access page. We reply with a scope-based estimate.",
      },
    ],
  },
  {
    slug: "residential-cleaning",
    anchor: "residential-cleaning",
    name: "Residential Cleaning",
    shortDescription:
      "A cleaner, calmer home on a schedule that fits—kitchens, baths, floors, and priority rooms handled with consistent standards.",
    bestFor: "Busy households, seasonal residents, and recurring home maintenance.",
    headline: "Residential Cleaning in Palm Beach County",
    authorityIntro:
      "Residential cleaning should feel dependable: the same attention to kitchens and baths, floors that look consistently kept, and communication you can count on. We tailor frequency and focus areas to your home—not a generic checklist.",
    included: [
      "Kitchen and bath sanitizing and wipe-down",
      "Dusting, vacuuming, and hard-surface floor care",
      "Priority rooms you designate each visit",
      "Supplies and equipment suited to your finishes",
    ],
    whoItsFor: [
      "Single-family homes and estates",
      "Condos and townhomes",
      "Seasonal Palm Beach residents opening or closing a residence",
    ],
    startingPriceLabel:
      "Standard residential cleaning often starts around $120; deep or move-focused visits typically start higher based on square footage and condition.",
    faq: [
      {
        q: "Do I need to be home during cleaning?",
        a: "Many clients provide access instructions. We align on security preferences, pets, and alarm codes in advance.",
      },
      {
        q: "Can you use specific products?",
        a: "If you have preferred products or sensitivities, note them when you request service and we will plan accordingly.",
      },
      {
        q: "How do you handle deep cleaning versus maintenance?",
        a: "Deep visits target built-up areas and longer untouched zones. Maintenance visits keep a baseline between deeper cycles.",
      },
      {
        q: "How do I request a walkthrough or quote?",
        a: "Use our quick access page to share photos, square footage, and priorities. We confirm scope and pricing before the first visit.",
      },
    ],
  },
  {
    slug: "commercial-cleaning",
    anchor: "commercial-cleaning",
    name: "Commercial Cleaning",
    shortDescription:
      "Customer-ready floors, restrooms, and touchpoints—commercial cleaning that supports your brand without slowing operations.",
    bestFor: "Retail, offices, showrooms, medical-adjacent spaces, and light industrial storefronts.",
    headline: "Commercial Cleaning in Palm Beach County",
    authorityIntro:
      "Commercial spaces live and die on details: restrooms, glass, floors, and high-touch surfaces. We build scopes around your hours, traffic patterns, and compliance needs—then execute with a steady local crew.",
    included: [
      "Restrooms, break areas, and high-touch disinfection by scope",
      "Trash removal and floor care matched to traffic",
      "Glass and entry refresh options",
      "After-hours scheduling when available",
    ],
    whoItsFor: [
      "Storefronts and boutiques",
      "Professional offices",
      "Dealerships and showrooms",
      "Small business suites",
    ],
    startingPriceLabel:
      "Commercial cleaning is quoted by square footage, frequency, and scope. Most accounts begin with a walkthrough or photo-based scope review.",
    faq: [
      {
        q: "Can you clean after business hours?",
        a: "Yes, when access allows. We align arrival windows with your building or landlord requirements.",
      },
      {
        q: "Do you provide supplies and equipment?",
        a: "We arrive with commercial-grade equipment and products suited to your surfaces and traffic level.",
      },
      {
        q: "How do you price commercial work?",
        a: "Pricing reflects frequency, square footage, and service depth. Photo estimates and short onsite reviews keep numbers accurate.",
      },
      {
        q: "Can you coordinate with property management?",
        a: "Yes. We work with managers, onsite staff, and vendor lists to keep access and billing straightforward.",
      },
    ],
  },
  {
    slug: "pressure-washing",
    anchor: "pressure-washing",
    name: "Pressure Washing / Exterior Cleaning",
    shortDescription:
      "Safer exterior renewal—walkways, driveways, siding, and patios cleaned with pressure or soft washing matched to the substrate.",
    bestFor: "Homes, HOAs, storefront approaches, and pool decks needing algae or grime removal.",
    headline: "Pressure Washing & Exterior Cleaning in Palm Beach County",
    authorityIntro:
      "Exterior cleaning is as much about technique as it is about pressure. We evaluate surface hardness, landscaping proximity, and staining type before choosing pressure washing or soft washing—so results look sharp without unnecessary risk.",
    included: [
      "Surface-appropriate pressure or soft washing",
      "Walkways, driveways, patios, and pool decks by scope",
      "Siding and stucco options where appropriate",
      "Rinsing and plant-conscious setup",
    ],
    whoItsFor: [
      "Homeowners restoring curb appeal",
      "HOAs maintaining common walks and entries",
      "Retail entries with heavy foot traffic",
    ],
    startingPriceLabel:
      "Many driveway and walkway refreshes start around $129; full-home exterior projects are scoped by square footage and height.",
    faq: [
      {
        q: "Will pressure washing damage my siding?",
        a: "Not when matched correctly. We use soft washing on delicate substrates and adjust distance, angle, and detergents to reduce risk.",
      },
      {
        q: "Do you pretreat algae and mildew?",
        a: "Yes. Pretreatment is often the difference between a surface that stays clean longer versus one that bounces back in weeks.",
      },
      {
        q: "Can you work around landscaping?",
        a: "We pre-wet sensitive plantings where needed, bag runoff when required, and adjust methods near beds and screens.",
      },
      {
        q: "How should I prepare my property?",
        a: "Close windows, clear fragile items from patios, and note any known leaks. We confirm water access and hose bibs before arrival.",
      },
    ],
  },
  {
    slug: "auto-detailing",
    anchor: "auto-detailing",
    name: "Auto Detailing",
    shortDescription:
      "Interior freshness and exterior depth—detailing that protects trim, wheels, and cabin materials for daily drivers and show vehicles.",
    bestFor: "Personal vehicles, weekend cars, dealership inventory support, and small fleets.",
    headline: "Auto Detailing in Palm Beach County",
    authorityIntro:
      "Detailing is finish work: wheels, trim, glass, leather, and carpets each need the right chemistry and agitation. We work carefully on interiors and exteriors so your vehicle looks refined—not rushed.",
    included: [
      "Exterior wash, wheels, and tire dressing by package",
      "Interior vacuum, wipe-down, and glass",
      "Leather conditioning and odor treatment when selected",
      "Package upgrades for paint enhancement by scope",
    ],
    whoItsFor: [
      "Homeowners maintaining high-use vehicles",
      "Dealerships needing consistent lot presentation",
      "Small business fleets",
    ],
    startingPriceLabel:
      "Interior–exterior detailing packages often start around $150; full correction-level work is quoted after inspection.",
    faq: [
      {
        q: "Do you service vehicles onsite?",
        a: "Service location depends on package and access. Share your address and vehicle type on our quick access page and we will confirm the setup.",
      },
      {
        q: "How long does a detail take?",
        a: "Timing varies by size, soil level, and add-ons. We provide an expected window when we confirm scope.",
      },
      {
        q: "Can you remove pet hair or sand?",
        a: "Yes, with additional time for extraction. Photos of the interior help us estimate accurately.",
      },
      {
        q: "Do you offer maintenance plans?",
        a: "Recurring interior refreshes and exterior washes are available for clients who want a steady standard year-round.",
      },
    ],
  },
  {
    slug: "carpet-steam-cleaning",
    anchor: "carpet-steam-cleaning",
    name: "Carpet & Steam Cleaning",
    shortDescription:
      "Hot-water extraction that lifts embedded soil—better air quality, renewed pile, and realistic dry-time guidance for each room.",
    bestFor: "Move-ins, rentals, pet households, and annual refreshes in high-traffic areas.",
    headline: "Carpet & Steam Cleaning in Palm Beach County",
    authorityIntro:
      "Carpet cleaning should improve how a room feels—not just how it looks for a day. We pre-vacuum, spot-treat realistically, and extract with fiber-appropriate temperatures and dry passes so results hold up.",
    included: [
      "Pre-vacuum and targeted spot treatment",
      "Hot water extraction by fiber and room",
      "Traffic-lane focus options for rentals",
      "Dry-time guidance based on humidity and ventilation",
    ],
    whoItsFor: [
      "Homeowners refreshing bedrooms and living areas",
      "Airbnb hosts between guests",
      "Property managers on turnover schedules",
    ],
    startingPriceLabel:
      "Room-based carpet cleaning often starts around $99 depending on size, furniture movement, and soil level.",
    faq: [
      {
        q: "How long do carpets take to dry?",
        a: "Dry times vary with humidity, fiber, and airflow. We set expectations before we start and advise on ventilation.",
      },
      {
        q: "Do you move furniture?",
        a: "Light furniture movement is available by agreement. Heavy pieces should be cleared in advance when possible.",
      },
      {
        q: "Can you clean area rugs?",
        a: "Yes, when fiber type and backing allow in-home extraction. Delicate rugs may require a different method—we confirm before service.",
      },
      {
        q: "How should I prepare?",
        a: "Vacuum loose debris if possible, secure pets, and note stains with cause if known. Photos speed quoting.",
      },
    ],
  },
  {
    slug: "trash-can-cleaning",
    anchor: "trash-can-cleaning",
    name: "Trash Can Cleaning",
    shortDescription:
      "Deodorized, sanitized bins—garages and service areas stay fresher with less pest attraction and odor carry into the home.",
    bestFor: "Homes, townhomes, and small multi-family sites with curbside or driveway access.",
    headline: "Trash Can Cleaning in Palm Beach County",
    authorityIntro:
      "Bins collect residue that hoses alone will not remove. We wash, deodorize, and sanitize so garages and carports stay cleaner between collection days—often paired with exterior services.",
    included: [
      "Interior bin wash and deodorizing",
      "Sanitizing rinse suited to local disposal rules",
      "Curbside or driveway service by arrangement",
    ],
    whoItsFor: ["Homeowners", "HOAs with shared pad sites", "Property managers"],
    startingPriceLabel:
      "Single-bin cleaning often starts around $25; multi-bin and community pad pricing is quoted by count and access.",
    faq: [
      {
        q: "How often should bins be cleaned?",
        a: "Many clients choose monthly or quarterly service in warm months when odor and residue build faster.",
      },
      {
        q: "Do I need to empty the bin first?",
        a: "Bins should be empty on service day. We coordinate timing after pickup when possible.",
      },
      {
        q: "Is the wash water contained?",
        a: "We work to minimize runoff and respect HOA or municipal requirements. Access to water and drainage is confirmed up front.",
      },
      {
        q: "Can this be bundled with pressure washing?",
        a: "Yes. Bundling exterior and bin service is common for garage and driveway refresh days.",
      },
    ],
  },
  {
    slug: "property-maintenance",
    anchor: "property-maintenance",
    name: "Property Maintenance",
    shortDescription:
      "Light maintenance and punch-list work that keeps rentals and second homes guest-ready between deeper projects.",
    bestFor: "Airbnb operators, seasonal homes, and small commercial sites needing dependable touch-ups.",
    headline: "Property Maintenance in Palm Beach County",
    authorityIntro:
      "Small issues become big guest problems when they stack up. We handle scoped maintenance alongside cleaning so owners and managers have one accountable local team for recurring care.",
    included: [
      "Minor repairs and touch-ups by agreed scope",
      "Coordination with cleaning and turnover schedules",
      "Photo documentation when helpful for owners",
      "Clear communication with managers and onsite contacts",
    ],
    whoItsFor: [
      "Short-term rental operators",
      "Seasonal homeowners",
      "Property managers with punch-list needs",
    ],
    startingPriceLabel:
      "Maintenance is quoted hourly or by task list after photos or a short onsite review.",
    faq: [
      {
        q: "What types of tasks do you handle?",
        a: "Light maintenance such as hardware adjustments, caulk touch-ups, filter changes, and minor cosmetic fixes—scoped in advance.",
      },
      {
        q: "Do you replace parts?",
        a: "We can source standard materials when agreed. Specialty items may require owner purchase and delivery.",
      },
      {
        q: "Can you coordinate with cleaners?",
        a: "Yes. We align timing so maintenance finishes before final cleaning and staging.",
      },
      {
        q: "How do I request service?",
        a: "Send a task list and photos through our quick access page. We confirm feasibility, timing, and pricing before work begins.",
      },
    ],
  },
  {
    slug: "airbnb-services",
    anchor: "airbnb-services",
    name: "Airbnb Co-Host & Property Services",
    shortDescription:
      "Turnover-ready cleans and staging touches that protect reviews—aligned to check-in windows and manager checklists.",
    bestFor: "Short-term rentals, co-hosted portfolios, and investor-operators scaling locally.",
    headline: "Airbnb Co-Host & Property Services in Palm Beach County",
    authorityIntro:
      "Guest expectations are high and time is short. We structure turnovers around your calendar, checklist, and linen workflow—then deliver consistent presentation so each arrival feels intentional.",
    included: [
      "Turnover cleaning aligned to check-in and check-out",
      "Linen reset and consumable checks when included in scope",
      "Photo-ready detailing before guest arrival",
      "Coordination notes for owners and co-hosts",
    ],
    whoItsFor: ["Airbnb owners", "Co-hosts", "Local operators with multiple units"],
    startingPriceLabel:
      "Turnover pricing depends on unit size, laundry requirements, and staging depth. Photo-based estimates keep numbers accurate.",
    faq: [
      {
        q: "Can you follow my cleaner checklist?",
        a: "Yes. Upload or share your checklist and we align each visit to the same standard.",
      },
      {
        q: "Do you handle laundry?",
        a: "Laundry can be included when equipment access and turnaround time support it. We confirm capacity before scheduling.",
      },
      {
        q: "What happens if a same-day turnover is tight?",
        a: "We prioritize realistic windows. If timing is impossible, we communicate early and propose the safest alternative.",
      },
      {
        q: "How do I book recurring turnovers?",
        a: "Use our quick access page to share your calendar cadence and unit details. We set a recurring slot when availability matches.",
      },
    ],
  },
  {
    slug: "restaurant-hospitality-cleaning",
    anchor: "restaurant-hospitality-cleaning",
    name: "Restaurant & Hospitality Cleaning",
    shortDescription:
      "Hospitality-grade resets for dining rooms, bars, patios, and guest-facing zones—executed on operating calendars, not gig-app timelines.",
    bestFor:
      "Restaurants, bars, cafés, clubs, boutique hotels, and hospitality storefronts that need dependable open/close discipline.",
    headline: "Restaurant & Hospitality Cleaning in Palm Beach County",
    authorityIntro:
      "Guest experience starts with how a space feels at open. We deliver structured hospitality cleaning—dining room presentation, bar detailing, restroom refreshes, floor care, and glass—aligned to your service windows, health standards, and brand presentation. Programs are built for operators who need the same crew standards night after night.",
    included: [
      "Dining room and front-of-house reset (tables, chairs, touchpoints)",
      "Bar area detailing and back-bar reachable surfaces",
      "Patio and exterior guest areas when included in scope",
      "Glass and storefront cleaning for street-facing presentation",
      "Restroom refreshes and consumable checks by agreement",
      "Floor care suited to front-of-house finishes",
      "Opening and closing reset checklists",
      "Recurring service programs and overnight support options",
    ],
    whoItsFor: [
      "Independent restaurants and chef-driven concepts",
      "Bars, lounges, and nightlife venues",
      "Cafés, bakeries, and fast-casual storefronts",
      "Hospitality groups coordinating multiple locations",
    ],
    process: [
      "Operations review — walkthrough, hours, access, and checklist alignment.",
      "Program design — cadence (nightly, weekly, overnight), zones, and escalation contacts.",
      "Service execution — crew follows agreed SOPs with photo notes when requested.",
      "Quality loop — manager sign-off and schedule adjustments as volume changes.",
    ],
    startingPriceLabel:
      "Hospitality programs are quoted after a brief walkthrough—square footage, hours of operation, and reset depth drive scope.",
    faq: [
      {
        q: "Do you support opening and closing resets?",
        a: "Yes. We structure visits around your open/close windows with checklists for dining room, bar, restrooms, and floors.",
      },
      {
        q: "Can you work overnight or outside guest hours?",
        a: "Overnight and pre-open slots are available when access and security protocols are confirmed in advance.",
      },
      {
        q: "How do recurring programs work?",
        a: "We agree cadence, zones, and escalation paths in writing—then assign consistent crews so standards do not drift week to week.",
      },
      {
        q: "What is the fastest way to scope a new location?",
        a: "Request a quote with photos, approximate seat count, and operating hours. We return a program outline before the first reset.",
      },
    ],
  },
  {
    slug: "move-in-move-out-relocation",
    anchor: "move-in-move-out-relocation",
    name: "Move-In / Move-Out & Relocation Support",
    shortDescription:
      "Property transition support for move-in readiness, move-out standards, and coordinated relocation labor—organized, documented, and manager-friendly.",
    bestFor:
      "Residents, renters, Airbnb operators, and property managers who need inspection-ready handoffs—not ad-hoc labor marketplaces.",
    headline: "Move-In / Move-Out & Relocation Support in Palm Beach County",
    authorityIntro:
      "Transitions fail when cleaning, logistics, and timing are fragmented. We provide move-in and move-out cleaning, labor-only moving assistance, furniture relocation within the property, turnover prep, and coordination for trash or junk removal—scoped in advance so owners, tenants, and managers share one accountable team.",
    included: [
      "Move-in cleaning for resident-ready presentation",
      "Move-out cleaning aligned to lease or manager checklists",
      "Labor-only moving help (no long-haul trucking)",
      "In-unit furniture relocation and room resets",
      "Trash and junk removal coordination with approved vendors",
      "Storage unit and garage organization support",
      "Apartment and condo transition prep",
      "Turnover timing coordinated with property managers",
    ],
    whoItsFor: [
      "Renters and homeowners between residences",
      "Property managers handling unit turns",
      "Airbnb operators between guest stays",
      "HOA and condo transitions requiring documented standards",
    ],
    process: [
      "Scope intake — photos, checklist, access, and target completion date.",
      "Written plan — cleaning depth, labor hours, and any third-party coordination.",
      "Transition day — crews execute in sequence to minimize downtime.",
      "Sign-off — walkthrough with owner, tenant, or manager before keys change hands.",
    ],
    startingPriceLabel:
      "Move-focused cleaning often starts around $200+ depending on unit size and condition; labor and coordination are quoted separately after scope review.",
    faq: [
      {
        q: "Is this full-service moving or long-distance hauling?",
        a: "No. We provide labor-only assistance and in-property relocation—organized transition support, not interstate moving.",
      },
      {
        q: "Can you meet property manager move-out standards?",
        a: "Yes. Share the manager checklist or inspection form and we align cleaning and touch-ups before final walkthrough.",
      },
      {
        q: "Do you coordinate junk or bulk item removal?",
        a: "We coordinate approved haul-away partners when included in scope. Items and access are confirmed before service day.",
      },
      {
        q: "How do I schedule around a closing or lease date?",
        a: "Request a quote with your target date, unit details, and photos. We confirm crew windows and dependencies before booking.",
      },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getRelatedServices(slug: ServiceSlug, limit = 3): ServiceDefinition[] {
  const idx = SERVICES.findIndex((s) => s.slug === slug);
  if (idx === -1) return [];
  const after = SERVICES.slice(idx + 1).filter((s) => s.slug !== slug);
  const before = SERVICES.slice(0, idx);
  return [...after, ...before].slice(0, limit);
}
