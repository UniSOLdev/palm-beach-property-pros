/**
 * Unified public service catalog.
 *
 * - The 12 core services keep their original slugs, names, and copy
 *   (source of truth: lib/services.ts) so existing URLs and SEO equity carry over.
 * - Private-client services (home watch, arrival prep, hurricane prep, vendor
 *   coordination, concierge) are premium additions (lib/site/content.ts).
 * - Prices are NEVER rendered: `startingPriceLabel` and any FAQ answer that
 *   mentions a dollar figure are dropped here.
 */
import { SERVICES as CORE, type ServiceDefinition } from "@/lib/services";
import { SERVICES as PREMIUM } from "@/lib/site/content";

export type CategoryId = "private-client" | "interiors" | "exteriors" | "automotive";

export type CatalogService = {
  slug: string;
  name: string;
  category: CategoryId;
  premium: boolean;
  summary: string;
  intro: string;
  includes: string[];
  idealFor: string[];
  faq: { q: string; a: string }[];
  image: string;
  imageAlt: string;
  seoTitle: string;
  seoDescription: string;
};

export const CATEGORIES: {
  id: CategoryId;
  title: string;
  eyebrow: string;
  lead: string;
  image: string;
  imageAlt: string;
}[] = [
  {
    id: "interiors",
    eyebrow: "Interiors",
    title: "Estate cleaning & interior care",
    lead: "Residential, deep, and turnover cleaning, glass, and carpet care, delivered by trained crews to a written standard.",
    image: "/photos/living-white.jpg",
    imageAlt: "Bright white living room with a fireplace and natural light",
  },
  {
    id: "exteriors",
    eyebrow: "Exteriors & grounds",
    title: "Grounds, hardscape & maintenance",
    lead: "Landscape upkeep, pressure washing, debris removal, and ongoing property maintenance, so the arrival is always immaculate.",
    image: "/photos/florida-home-palms-pool.jpg",
    imageAlt: "White Florida home with palms, tropical landscaping, and a pool",
  },
  {
    id: "automotive",
    eyebrow: "Automotive",
    title: "Detailing, at your residence",
    lead: "Hand washing, interior refresh, and show-ready finishes, done on site with care for every surface.",
    image: "/photos/detailing-hand-wash.jpg",
    imageAlt: "Luxury sedan being hand washed with foam",
  },
  {
    id: "private-client",
    eyebrow: "Private client services",
    title: "Home watch & private client care",
    lead: "For seasonal residents: scheduled home watch, arrival and departure preparation, storm readiness, and one trusted point of contact.",
    image: "/photos/hero-estate-golden-hour.jpg",
    imageAlt: "Mediterranean-style estate and pool terrace at golden hour",
  },
];

const CORE_META: Record<string, { category: CategoryId; image: string; imageAlt: string }> = {
  "residential-cleaning": { category: "interiors", image: "/photos/living-white.jpg", imageAlt: "Spotless white living room with natural light" },
  "move-out-cleaning": { category: "interiors", image: "/photos/bedroom-modern.jpg", imageAlt: "Freshly reset bedroom with crisp linens" },
  "window-cleaning": { category: "interiors", image: "/photos/living-pool-view.jpg", imageAlt: "Floor-to-ceiling glass overlooking a pool" },
  "carpet-steam-cleaning": { category: "interiors", image: "/photos/living-modern.jpg", imageAlt: "Modern living room with a clean area rug" },
  "airbnb-services": { category: "interiors", image: "/photos/bedroom-classic.jpg", imageAlt: "Guest-ready bedroom with tufted headboard" },
  "commercial-cleaning": { category: "interiors", image: "/photos/resort-pool-dusk.jpg", imageAlt: "Resort-style building and pool at dusk" },
  "yard-landscape": { category: "exteriors", image: "/photos/lawn-estate.jpg", imageAlt: "Manicured lawn in front of a modern home" },
  "pressure-washing": { category: "exteriors", image: "/photos/pool-terrace.jpg", imageAlt: "Clean pool deck and terrace pavers" },
  "property-maintenance": { category: "exteriors", image: "/photos/architecture-dusk.jpg", imageAlt: "Modern residence lit at dusk" },
  "trash-debris-removal": { category: "exteriors", image: "/photos/exterior-white-minimal.jpg", imageAlt: "Clean white exterior and walkway" },
  "trash-can-cleaning": { category: "exteriors", image: "/photos/villa-pool-modern.jpg", imageAlt: "Pristine modern villa exterior" },
  "auto-detailing": { category: "automotive", image: "/photos/detailing-hand-wash.jpg", imageAlt: "Luxury sedan being hand washed" },
};

const PREMIUM_META: Record<string, { image: string; imageAlt: string }> = {
  "home-watch": { image: "/photos/hero-estate-golden-hour.jpg", imageAlt: "Mediterranean-style estate at golden hour" },
  "arrival-departure": { image: "/photos/kitchen-white.jpg", imageAlt: "Bright white kitchen ready for arrival" },
  "hurricane-prep": { image: "/photos/palms-sky.jpg", imageAlt: "Palm trees against a wide coastal sky" },
  "vendor-coordination": { image: "/photos/estate-pool-white.jpg", imageAlt: "White contemporary residence with pool" },
  concierge: { image: "/photos/hero-interior-arched.jpg", imageAlt: "Elegant interior with arched windows" },
};

const hasPrice = (s: string) => /\$\s?\d/.test(s);

function fromCore(s: ServiceDefinition): CatalogService {
  const meta = CORE_META[s.slug];
  return {
    slug: s.slug,
    name: s.name,
    category: meta.category,
    premium: false,
    summary: s.shortDescription,
    intro: s.authorityIntro,
    includes: [...s.included],
    idealFor: [...s.whoItsFor],
    faq: s.faq.filter((f) => !hasPrice(f.a) && !hasPrice(f.q)).map((f) => ({ q: f.q, a: f.a })),
    image: meta.image,
    imageAlt: meta.imageAlt,
    seoTitle: s.headline,
    seoDescription: `${s.shortDescription} Private quotes from Palm Beach Property Pros.`.slice(0, 300),
  };
}

const premium: CatalogService[] = PREMIUM.filter((p) => p.slug in PREMIUM_META).map((p) => ({
  slug: p.slug,
  name: p.name,
  category: "private-client",
  premium: true,
  summary: p.summary,
  intro: p.intro,
  includes: p.includes,
  idealFor: [p.idealFor],
  faq: [],
  image: PREMIUM_META[p.slug].image,
  imageAlt: PREMIUM_META[p.slug].imageAlt,
  seoTitle: p.seoTitle,
  seoDescription: p.seoDescription,
}));

/** Seasonal services (no prices, like everything else in the catalog). */
const seasonal: CatalogService[] = [
  {
    slug: "holiday-lighting",
    name: "Holiday Lighting",
    category: "exteriors",
    premium: true,
    summary:
      "Custom holiday lighting for estates: designed, installed, looked after through the season, then taken down after the holidays.",
    intro:
      "Warm-white rooflines, wrapped palms, softly lit hedges and wreaths at the door, installed by our crew on your schedule, including before you arrive for the season. One call, no ladders, nothing to untangle in January.",
    includes: [
      "Walkthrough and lighting plan for rooflines, palms, hedges, and the entry",
      "Warm-white LED lighting sized to your property",
      "Professional installation on your schedule, including while you're away",
      "Timers set so the lights turn on and off by themselves",
      "In-season checks and quick fixes if a strand or connection fails",
      "Take-down after the holidays",
    ],
    idealFor: [
      "Seasonal residents who want the house lit before they arrive",
      "Families hosting over the holidays",
      "Estates with tall palms and long rooflines that need a careful, insured crew",
    ],
    faq: [
      {
        q: "When should we book?",
        a: "As early as you can. Installs book up quickly from late November, and most clients want their lights on by the second week of December.",
      },
      {
        q: "Can you install while we're away?",
        a: "Yes. We can finish the install before you arrive and send you photos once everything is lit.",
      },
      {
        q: "Do you take everything down afterwards?",
        a: "Yes. Take-down is scheduled after the holidays at a time that suits you.",
      },
    ],
    image: "/photos/holiday-lighting-estate.jpg",
    imageAlt: "Mediterranean-style estate at dusk with warm holiday lights on the roofline, palms, and hedges",
    seoTitle: "Holiday & Christmas Light Installation in Palm Beach",
    seoDescription:
      "Christmas and holiday light installation for Palm Beach estates: rooflines, palm wraps, hedges and wreaths, installed, maintained and taken down. Request a private quote.",
  },
];

export const CATALOG: CatalogService[] = [...CORE.map(fromCore), ...premium, ...seasonal];

export function getCatalogService(slug: string) {
  return CATALOG.find((s) => s.slug === slug);
}

export function servicesIn(category: CategoryId) {
  return CATALOG.filter((s) => s.category === category);
}

/** Options for the quote form's service select. */
export const QUOTE_SERVICE_OPTIONS = [...CATALOG.map((s) => s.name), "Multiple / not sure"];
