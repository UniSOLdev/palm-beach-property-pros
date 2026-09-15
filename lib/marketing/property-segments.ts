import { CORE_SERVICES } from "@/lib/marketing/core-services";
import type { ServiceSlug } from "@/lib/services";

export type PropertySegment = {
  id: string;
  slug: ServiceSlug;
  name: string;
  zone: string;
  tagline: string;
  rotation: number;
};

/** One scroll stop per core property-maintenance zone. */
export const PROPERTY_SEGMENTS: PropertySegment[] = CORE_SERVICES.map((service, index) => {
  const zones = {
    "yard-landscape": "Yard restoration",
    "window-cleaning": "Glass & storefronts",
    "move-out-cleaning": "Interior cleaning",
    "trash-debris-removal": "Cleanouts & debris",
  } as const;

  return {
    id: service.slug,
    slug: service.slug,
    name: service.name,
    zone: zones[service.slug as keyof typeof zones],
    tagline: service.tagline,
    rotation: index * 90,
  };
});
