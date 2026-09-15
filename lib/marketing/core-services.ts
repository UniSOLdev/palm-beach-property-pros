import type { ServiceSlug } from "@/lib/services";

/** Public restoration / cleaning / maintenance lineup. */
export type CoreService = {
  slug: ServiceSlug;
  name: string;
  tagline: string;
  examples: string[];
};

export const CORE_SERVICES: CoreService[] = [
  {
    slug: "yard-landscape",
    name: "Yard restoration & maintenance",
    tagline:
      "Overgrown resets, hedge, edge, mow, and blow — residential estates and commercial grounds.",
    examples: ["Estate cleanups", "Weekly maintenance", "Seasonal restoration"],
  },
  {
    slug: "window-cleaning",
    name: "Window cleaning",
    tagline:
      "Interior and exterior glass for homes, storefronts, and managed portfolios — coastal residue handled.",
    examples: ["Residential glass", "Storefronts", "Commercial facades"],
  },
  {
    slug: "move-out-cleaning",
    name: "Interior cleaning & turnovers",
    tagline:
      "Move-out, move-in, and rental turnovers — inspection-ready interiors for residential and STR.",
    examples: ["Move-out prep", "Rental turnovers", "Deep resets"],
  },
  {
    slug: "trash-debris-removal",
    name: "Cleanouts & debris removal",
    tagline:
      "Property cleanouts, haul-offs, and yard debris — documented before and after for owners and PMs.",
    examples: ["Estate cleanouts", "Commercial debris", "Yard waste haul-offs"],
  },
];
