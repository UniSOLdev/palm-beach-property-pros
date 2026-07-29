# PBPP Site Imagery Inventory

Last updated: 2026-07-29

This document tracks every marketing image on the public site, its classification, license, usage, and replacement priority.

## Image-type rules

| `imageType` | Allowed in |
|-------------|------------|
| `real-project` | Before/after, case studies, project results, sections labeled "Palm Beach Property Pros project" |
| `stock` | Service cards, hero, service page intros |
| `generated` | Same as stock (none currently) |
| `decorative` | Customer paths, section backgrounds, CTA backgrounds |

**Never** describe stock or decorative images as PBPP completed work, customer properties, or before/after results.

Data lives in `lib/media/site-imagery.ts`. Regenerate stock files with `npm run media:stock`.

---

## Stock images (temporary — replace with PBPP photography)

| ID | File | Service | Used on | Priority | Source |
|----|------|---------|---------|----------|--------|
| `hero-home-exterior` | `/media/stock/hero/home-exterior.webp` | Homepage hero | Hero background | **High** | [Unsplash](https://unsplash.com/photos/ba8f99d2cdde) |
| `service-window-cleaning` | `/media/stock/services/window-cleaning.webp` | Window Cleaning | Service card, service page | **High** | [Unsplash](https://unsplash.com/photos/c64695cc6952) |
| `service-pressure-washing` | `/media/stock/services/pressure-washing.webp` | Pressure Washing | Service card, service page | **High** | [Unsplash](https://unsplash.com/photos/d208bec867a1) |
| `service-residential-cleaning` | `/media/stock/services/residential-cleaning.webp` | Residential Cleaning | Service card, service page | **High** | [Unsplash](https://unsplash.com/photos/46c336c7fd55) |
| `service-commercial-cleaning` | `/media/stock/services/commercial-cleaning.webp` | Commercial Cleaning | Service card, service page | Medium | [Unsplash](https://unsplash.com/photos/37526070297c) |
| `service-property-care` | `/media/stock/services/property-care.webp` | Property Care | Service card, service page | Medium | [Unsplash](https://unsplash.com/photos/be6161a56a0c) |
| `service-mobile-detailing` | `/media/stock/services/mobile-detailing.webp` | Mobile Detailing | Service card, service page | **High** | [Unsplash](https://unsplash.com/photos/bd32c8ce0db2) |
| `path-residential` | `/media/stock/sections/residential-path.webp` | Residential path | Homepage customer path | Low | [Unsplash](https://unsplash.com/photos/a197022b5858) |
| `path-commercial` | `/media/stock/sections/commercial-path.webp` | Commercial path | Homepage customer path | Low | [Unsplash](https://unsplash.com/photos/f200968a6e72) |
| `section-recurring-care` | `/media/stock/sections/recurring-property-care.webp` | Recurring care | Homepage recurring section | Medium | [Unsplash](https://unsplash.com/photos/ce09059eeffa) |
| `section-how-it-works` | `/media/stock/sections/how-it-works.webp` | How it works | Homepage process background | Low | [Unsplash](https://unsplash.com/photos/6ed189bf02f4) |
| `section-final-cta` | `/media/stock/sections/final-cta.webp` | Final CTA | Homepage estimate CTA | Low | [Unsplash](https://unsplash.com/photos/ffad4c1539a9) |

**License:** All stock images above are from [Unsplash](https://unsplash.com/license) — free for commercial use. Attribution not required; source URLs recorded in `public/media/stock/manifest.json` and `lib/media/site-imagery.ts`.

---

## Real PBPP project images

| ID | Location | Used on | Notes |
|----|----------|---------|-------|
| `estate-cleanup-001` | `/media/curated/estate-cleanup-001/` | Homepage before/after slider, case study page | Palm Beach Gardens estate vegetation cleanup — authentic field photos |
| Case study before/after | `before-img-7699.webp`, `after-img-7714.webp` | `/projects/estate-cleanup-palm-beach-gardens` | Labeled as PBPP project only |

---

## Generated images

None currently in production.

---

## Replace first (when PBPP photos are available)

1. Hero — real Palm Beach County property exterior at golden hour
2. Window cleaning — crew on local home
3. Pressure washing — driveway or pool deck project
4. Residential cleaning — finished room or in-progress clean
5. Mobile detailing — SUV/truck at customer location
6. Commercial cleaning — storefront or office PBPP has serviced
7. Property care — estate walkthrough or cleanup photo
8. Recurring care section — seasonal or vacation-home program photo

---

## Technical notes

- All stock images stored locally as WebP under `public/media/stock/`
- Hero: 2200×1238px; service cards: 1200×800px; sections: 1400–2000px wide
- Regenerate: `npm run media:stock`
- Do not hotlink Unsplash URLs in production components — use inventory paths only
