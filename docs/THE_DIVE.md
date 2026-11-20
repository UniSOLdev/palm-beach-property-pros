# "The Dive": signature scroll story

One continuous, scroll-driven journey that follows **water** through everything Palm
Beach Property Pros does. The camera is the diver's point of view the whole way down,
so the person is continuous without animating a character in every scene. The diver
appears in full only at the end, under the yacht.

Each chapter ends on a full-frame transition (bubbles, spray, or foam), so chapter cuts
are invisible. On the site, each chapter is a scroll-scrubbed frame sequence with a
caption and a "Request a private quote" link for that service.

| # | Chapter | Service it sells | Scene script | Transition out |
|---|---|---|---|---|
| 1 | **The Pool**: golden hour; fallen fronds drift away as the pool clears itself; dive through the surface | Pool and outdoor care, home watch | `pool_dive.py` | bubble curtain |
| 2 | **The Residence**: surface into a bright, spotless interior (marble, linen, arched windows) | Estate and residential cleaning, carpet | `residence.py` | glass reflection |
| 3 | **The Glass**: streaked floor-to-ceiling glass wipes crystal clear onto the ocean view | Window cleaning | `glass.py` | sun flare |
| 4 | **The Grounds**: out over travertine and pavers as dark, weathered stone washes bright; manicured hedges and royal palms | Pressure washing, landscape, maintenance | `grounds.py` | spray mist |
| 5 | **The Motor Court**: foam cannon blankets an unbranded sedan; rinse reveals mirror paint | Auto detailing | `foam_cannon.py` + `car_spin.py` | foam |
| 6 | **The Marina**: golden-hour orbit of an 80-ft motor yacht | **Not offered: chapter cut (Nov 2026)** | `yacht_orbit.py` | dive below the waterline |
| 7 | **Beneath**: the diver works along the hull; growth gives way to gleaming gelcoat; camera tilts up to the light | **Not offered: chapter cut (Nov 2026)** | `hull_clean.py` | bright surface → page footer |

The live story ends at Chapter 5 (The Motor Court), followed by a closing "Request a private quote".

## Art direction: Palm Beach luxury
- **Light:** golden hour (sun 7–15° elevation, warm 3200–4000 K), long soft shadows, gentle haze. Interiors bright and airy, as if late-morning light came through linen.
- **Architecture:** Mediterranean Revival and Bermuda/British Colonial. Cream and white stucco, terracotta barrel-tile roofs, arched windows and loggias, black-steel window frames, coral-stone and travertine.
- **Landscape:** royal and coconut palms, clipped ficus and podocarpus hedges, bougainvillea accents, striped manicured turf. No clutter.
- **Water:** clear turquoise with visible caustics. Pool mosaic in pale aqua and white.
- **Interiors:** white oak and marble, linen upholstery, brass hardware, fresh white hydrangeas. Minimal and immaculate.
- **Vehicles:** Rolls-Royce / Ferrari-class presence: a long-hood grand saloon in two-tone or deep navy, or a V12 GT in rosso or pearl white. **No badges, hood ornaments, wordmarks, or plates**, to avoid implying a manufacturer endorsement. Best of all: real client cars, filmed with written permission.
- **Yachts:** no hull names, logos, or registration numbers.
- **Palette:** cream `#FAF8F4`, navy `#081A2E`, brass `#C2A06A`, aqua.
- **Camera:** slow, steady, constant-speed gimbal moves; 24–35 mm for spaces, 50–85 mm for the car; no shake, no motion blur.
- **Never:** recognizable real homes or communities, people's faces (the diver's face stays behind the mask), text or numbers in frame, cartoon looks.

## Asset shopping list (licensed for commercial web use)
| Asset | Search terms (CGTrader / TurboSquid / Evermotion) | Approx. cost |
|---|---|---|
| Estate exterior + pool | "Mediterranean villa", "Spanish revival mansion", "luxury villa pool" | $60–150 |
| Royal palms pack | "royal palm", "Roystonea", "palm tree pack Cycles" | $20–60 |
| Luxury interior | "luxury living room interior Blender", "Evermotion Archinteriors" (one scene) | $30–80 |
| Car (hero) | Rolls-Royce-class grand saloon or Ferrari-class V12 GT look: "luxury grand saloon", "Italian GT coupe". **Commercial license required** (skip "editorial use only"). Remove all badges, hood ornaments, and wordmarks | $60–200 |
| Motor yacht ~80 ft | "motor yacht 80ft", "superyacht" | $40–120 |
| Scuba diver, rigged | "scuba diver rigged", "diver with tank" (mask on) | $30–80 |
| HDRIs and textures | polyhaven.com (free, CC0) | $0 |

**Total: about $220–610.** Keep the licenses in `renders/LICENSES.md`.

## Render order on the GPU PC
1. Look-dev at `--preview --only` on 3–4 frames per chapter, then approve.
2. Final: `--samples 256` at 1920×1080. Roughly 40–110 min per chapter on the RX 7700 XT.
3. Build web frames and push to a branch, then review the Vercel preview before merging.
