import { MEDIA_REGISTRY } from "@/lib/media/registry";
import type { MediaAsset } from "@/lib/media/types";
import type { ServiceSlug } from "@/lib/services";

/** PBPP field photos — swap individual entries when you upload new projects. */
const CURATED_BASE = "/media/curated/estate-cleanup-001/images";

const GENERIC_BLUR =
  "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAACQAQCdASoQAAkAA4BaJZAC7AClNcAA+9N4jNAPOFK18SzPmm7Jlo4+cxyw2p8Cc1XCTi3Z3OimF2mHlOyvXgAA";

const CURATED = {
  hero: {
    src: `${CURATED_BASE}/hero-3d32be01-d35f-4ecf-800e-6d0219e656f6.webp`,
    alt: "Restored Palm Beach Gardens estate exterior after vegetation cleanup",
  },
  yardRestored: {
    src: `${CURATED_BASE}/gallery-img-7912.webp`,
    alt: "Restored yard and landscape lines after estate cleanup, Palm Beach Gardens",
  },
  debrisWork: {
    src: `${CURATED_BASE}/gallery-img-7890.webp`,
    alt: "Crew clearing debris and restoring exterior pathways, Palm Beach Gardens",
  },
  exteriorWide: {
    src: `${CURATED_BASE}/gallery-3d32be01-d35f-4ecf-800e-6d0219e656f6.webp`,
    alt: "Wide estate exterior after property restoration, Palm Beach Gardens",
  },
  afterClean: {
    src: `${CURATED_BASE}/after-img-7910.webp`,
    alt: "Property exterior after professional cleanup, Palm Beach Gardens",
  },
  afterYard: {
    src: `${CURATED_BASE}/after-img-7879.webp`,
    alt: "Restored landscape and clean exterior lines, Palm Beach County",
  },
  pressureWash: {
    src: `${CURATED_BASE}/action-img-7890.webp`,
    alt: "Exterior refresh and surface cleaning on a Palm Beach County property",
  },
  detailWork: {
    src: `${CURATED_BASE}/detail-img-7873.webp`,
    alt: "Detailed exterior property care, Palm Beach Gardens",
  },
  turnoverReady: {
    src: `${CURATED_BASE}/after-img-7912.webp`,
    alt: "Arrival-ready property after turnover cleaning, Palm Beach County",
  },
} as const;

function authentic(
  id: string,
  category: MediaAsset["category"],
  item: (typeof CURATED)[keyof typeof CURATED],
  aspect: MediaAsset["aspect"] = "landscape",
): MediaAsset {
  return {
    id,
    category,
    src: item.src,
    alt: item.alt,
    source: "authentic",
    blurDataURL: GENERIC_BLUR,
    focal: "object-[center_38%]",
    aspect,
    overlay: "card",
    location: "Palm Beach Gardens",
  };
}

const SERVICE_IMAGES: Record<ServiceSlug, MediaAsset> = {
  "yard-landscape": authentic("service.yard", "exterior", CURATED.yardRestored),
  "trash-debris-removal": authentic("service.debris", "exterior", CURATED.debrisWork),
  "window-cleaning": authentic("service.window", "exterior", CURATED.detailWork),
  "move-out-cleaning": authentic("service.move-out", "interior", CURATED.afterClean),
  "auto-detailing": authentic("service.auto", "exterior", CURATED.exteriorWide),
  "residential-cleaning": authentic("service.residential", "interior", CURATED.afterYard),
  "commercial-cleaning": authentic("service.commercial", "interior", CURATED.exteriorWide),
  "pressure-washing": authentic("service.pressure", "exterior", CURATED.pressureWash),
  "carpet-steam-cleaning": authentic("service.carpet", "interior", CURATED.detailWork),
  "trash-can-cleaning": authentic("service.trash-can", "exterior", CURATED.exteriorWide),
  "property-maintenance": authentic("service.maintenance", "property-support", CURATED.hero, "hero"),
  "airbnb-services": authentic("service.airbnb", "interior", CURATED.turnoverReady),
};

export function getServiceImageAsset(slug: ServiceSlug): MediaAsset {
  return SERVICE_IMAGES[slug];
}

export function getSiteHeroFallback(): MediaAsset {
  return authentic("site.hero.fallback", "hero", CURATED.hero, "hero");
}

export function getServiceAreaImage(): MediaAsset {
  return authentic("service.area", "hero", CURATED.exteriorWide, "hero");
}
