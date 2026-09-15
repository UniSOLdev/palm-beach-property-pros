import { MEDIA_REGISTRY } from "@/lib/media/registry";
import type { MediaAsset } from "@/lib/media/types";
import type { ServiceSlug } from "@/lib/services";

/** PBPP field photos — swap individual entries when you upload new projects. */
const CURATED_BASE = "/media/curated/estate-cleanup-001/images";

const CURATED = {
  hero: {
    src: `${CURATED_BASE}/hero-3d32be01-d35f-4ecf-800e-6d0219e656f6.webp`,
    blur: "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAACQAQCdASoQAAkAA4BaJZAC7AClNcAA+9N4jNAPOFK18SzPmm7Jlo4+cxyw2p8Cc1XCTi3Z3OimF2mHlOyvXgAA",
    alt: "Restored Palm Beach Gardens estate exterior after vegetation cleanup",
  },
  yardRestored: {
    src: `${CURATED_BASE}/gallery-img-7912.webp`,
    blur: "data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAAAQBACdASoQABUAPu1iqU2ppaOiMAgBMB2JYgCdAB7AZjkVO80P7Jz2AAD+ZZZajl2PL5h8ZzONnYX4O3TvaT6Dww5TN9FceFCfLyNOOcwTKgnIlgJdauRWT4S+YEui+anCOgyzL/DvQAAA",
    alt: "Restored yard and landscape lines after estate cleanup, Palm Beach Gardens",
  },
  debrisWork: {
    src: `${CURATED_BASE}/gallery-img-7890.webp`,
    blur: "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAAAQAgCdASoQAAwAA4BaJYwAAn+HebEIiO8gAP7AQQaAmygE2eytiPTmiu5skT4RIMV2PkKVG57xcwvt/VEAP/lxmjDRtF91e97kAAAA",
    alt: "Crew clearing debris and restoring exterior pathways, Palm Beach Gardens",
  },
  exteriorWide: {
    src: `${CURATED_BASE}/gallery-3d32be01-d35f-4ecf-800e-6d0219e656f6.webp`,
    blur: "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAACQAQCdASoQAAkAA4BaJZAC7AClNcAA+9N4jNAPOFK18SzPmm7Jlo4+cxyw2p8Cc1XCTi3Z3OimF2mHlOytUAAA",
    alt: "Wide estate exterior after property restoration, Palm Beach Gardens",
  },
} as const;

/** Editorial stock — premium South Florida / property-care aesthetic until PBPP media replaces. */
const STOCK = {
  window: "https://images.unsplash.com/photo-1600585154340-be6162a97a0a",
  interior: "https://images.unsplash.com/photo-1600210492492-0946911122ea",
  kitchen: "https://images.unsplash.com/photo-1600566752355-35778368630a",
  auto: "https://images.unsplash.com/photo-1601362840469-51e4f7847786",
  pressure: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
  carpet: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea",
  commercial: "https://images.unsplash.com/photo-1600607687929-7526a8a2ee4d",
  turnover: "https://images.unsplash.com/photo-1600607687644-c7171b42498f",
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
    blurDataURL: item.blur,
    focal: "object-[center_38%]",
    aspect,
    overlay: "card",
    location: "Palm Beach Gardens",
  };
}

function stock(
  id: string,
  category: MediaAsset["category"],
  src: string,
  alt: string,
  aspect: MediaAsset["aspect"] = "landscape",
): MediaAsset {
  return {
    id,
    category,
    src,
    alt,
    source: "scaffold",
    focal: "object-center",
    aspect,
    overlay: "card",
    location: "Palm Beach County",
  };
}

const SERVICE_IMAGES: Record<ServiceSlug, MediaAsset> = {
  "yard-landscape": authentic("service.yard", "exterior", CURATED.yardRestored),
  "trash-debris-removal": authentic("service.debris", "exterior", CURATED.debrisWork),
  "window-cleaning": stock(
    "service.window",
    "exterior",
    STOCK.window,
    "Luxury home with clean glass lines and coastal light, Palm Beach County",
  ),
  "move-out-cleaning": stock(
    "service.move-out",
    "interior",
    STOCK.kitchen,
    "Bright kitchen and interior ready for turnover, Palm Beach County",
  ),
  "auto-detailing": stock(
    "service.auto",
    "exterior",
    STOCK.auto,
    "Premium vehicle exterior finish after professional detailing",
  ),
  "residential-cleaning": stock(
    "service.residential",
    "interior",
    STOCK.interior,
    "Refined residential interior with natural light",
  ),
  "commercial-cleaning": stock(
    "service.commercial",
    "interior",
    STOCK.commercial,
    "Clean commercial interior with polished finishes",
  ),
  "pressure-washing": stock(
    "service.pressure",
    "exterior",
    STOCK.pressure,
    "South Florida luxury home exterior and hardscape",
  ),
  "carpet-steam-cleaning": stock(
    "service.carpet",
    "interior",
    STOCK.carpet,
    "Fresh carpet and interior surfaces after deep cleaning",
  ),
  "trash-can-cleaning": authentic("service.trash-can", "exterior", CURATED.exteriorWide),
  "property-maintenance": authentic("service.maintenance", "property-support", CURATED.hero, "hero"),
  "airbnb-services": stock(
    "service.airbnb",
    "interior",
    STOCK.turnover,
    "Arrival-ready property entrance for short-term rental turnover",
  ),
};

export function getServiceImageAsset(slug: ServiceSlug): MediaAsset {
  return SERVICE_IMAGES[slug];
}

export function getSiteHeroFallback(): MediaAsset {
  return authentic("site.hero.fallback", "hero", CURATED.hero, "hero");
}

export function getServiceAreaImage(): MediaAsset {
  return MEDIA_REGISTRY.local.waterfront;
}
