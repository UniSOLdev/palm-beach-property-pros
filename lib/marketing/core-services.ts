import type { ServiceSlug } from "@/lib/services";

/** Customer-facing lineup — use on homepage, quote form, and marketing decks. */
export type CoreService = {
  slug: ServiceSlug;
  name: string;
  tagline: string;
  examples: string[];
};

export const CORE_SERVICES: CoreService[] = [
  {
    slug: "yard-landscape",
    name: "Yard & landscape",
    tagline: "Hedge, edge, mow, blow — properties that look maintained from the street.",
    examples: ["Weekly maintenance", "Estate cleanups", "Seasonal resets"],
  },
  {
    slug: "window-cleaning",
    name: "Window cleaning",
    tagline: "Interior and exterior glass, frames, and coastal residue handled with care.",
    examples: ["Residential glass", "Storefronts", "Water-view homes"],
  },
  {
    slug: "move-out-cleaning",
    name: "Move-out cleaning",
    tagline: "Turnover-ready interiors for rentals, sales, and seasonal close-outs.",
    examples: ["Rental turnovers", "Move-out prep", "Deep resets"],
  },
  {
    slug: "trash-debris-removal",
    name: "Trash & debris removal",
    tagline: "Cleanouts, haul-offs, and property debris cleared with photo documentation.",
    examples: ["Estate debris", "Cleanout haul-offs", "Yard waste"],
  },
  {
    slug: "auto-detailing",
    name: "Interior & exterior detailing",
    tagline: "Mobile detailing for daily drivers, fleets, and show-ready finishes.",
    examples: ["Interior refresh", "Exterior polish", "Full detail"],
  },
];
