# Render Pipeline: Blender → Website

Photoreal Blender renders become interactive sequences on palmbeachpropertypros.com
(drag-to-spin, scroll-scrubbed fly-throughs). Renders run on a local GPU PC; the
website consumes compressed WebP frame sequences.

## Machine
- Windows PC · Ryzen 9 · Radeon RX 7700 XT (12 GB) · 32 GB RAM
- Blender 4.2 LTS+ · Cycles · **HIP** device (Edit → Preferences → System → Cycles Render Devices → HIP, enable the 7700 XT; update AMD Adrenalin if greyed out)
- Run headless: `blender -b scene.blend -P script.py` (scenes are built from Python scripts in `renders/scenes/`, so they're reproducible)

## Brand rules (non-negotiable)
- Photoreal only. No stylized or cartoon looks.
- Rolls-Royce / Ferrari-class vehicles are welcome, but **badges, hood ornaments, and wordmarks are removed**, and models must have a commercial license (no "editorial use only"). No license plates, no hull names.
- Homes must be **fictional**: never a recognizable real property or community, and no house numbers or gates.
- No people.
- Palette: golden hour, warm whites, deep navy, brass accents. Calm, slow, premium camera moves.

## Global render settings
| Setting | Value |
|---|---|
| Engine | Cycles, HIP GPU |
| Samples | 256 (final), 64 (preview); denoise: OpenImageDenoise |
| Color | AgX, look "Medium High Contrast" |
| Resolution | 1920×1080 master (16:9). **Keep the subject in the center third**, because phones crop to a vertical 9:16 center |
| Motion blur | **Off** (frames are scrubbed by the user, so each must be crisp) |
| Output | PNG 16-bit frames → converted by the build script |
| Lighting | Poly Haven HDRIs (CC0) + area lights; golden-hour sun |

## Render packages

### 1. `car-spin`: drag-to-spin vehicle (detailing page)
- Unbranded luxury sedan or SUV on a dark polished studio floor with soft reflections.
- **72 frames = one full 360° turn** (5° per frame), camera orbiting at about 1.2 m height. It must loop seamlessly (frame 72 → frame 1).
- Variant A "clean": mirror-finish paint.
- Variant B "foam": thick white snow-foam coating (particle and metaball or geometry-nodes foam), drips on lower panels.
- The site shows a toggle: "Before / Foam / Finish".

### 2. `foam-cannon`: scroll sequence (detailing page)
- 120 frames, about 5 s at 24 fps. A foam cannon sprays across the car's side; foam builds, then a pressure rinse reveals gleaming paint.
- Close, slow lateral camera dolly.

### 3. `yacht-orbit`: scroll sequence (marine imagery)
- 120 frames. An unbranded 70–90 ft motor yacht at anchor on turquoise water, golden hour. Slow 120° orbit plus a slight rise.
- Ocean shader or displacement water with sun glints.

### 4. `home-flythrough`: homepage hero replacement
- 150 frames, one continuous camera path:
  aerial over palms → descend onto a palm-lined drive → glide to an arched front door → doors swing open → into a bright interior → fade toward warm white (#FAF8F4).
- Fictional Mediterranean-Revival estate (cream stucco, terracotta roof).
- Export as MP4 (H.264, high quality), then run `npm run hero:build -- path/to/home-flythrough.mp4`. The homepage switches to it automatically (see README → Hero footage).

### 5. `pool-dive` and 6. `hull-clean`: chapters of "The Dive"
See `docs/THE_DIVE.md` for the full seven-chapter scroll story and the Palm Beach art direction.

## Scene scripts (`renders/scenes/`, tested headless in Blender 4.0)
| Script | Test command |
|---|---|
| `car_spin.py` | `blender -b -P renders/scenes/car_spin.py -- --model car.glb --variant foam --preview --only 1,19,37,55` |
| `foam_cannon.py` | `... foam_cannon.py -- --model car.glb --preview --only 1,45,65,110` |
| `yacht_orbit.py` | `... yacht_orbit.py -- --model yacht.glb --preview --only 1,60,120` |
| `home_flythrough.py` | `... home_flythrough.py -- --model estate.blend --door X,Y,Z --door-objects DoorL,DoorR --preview` |
| `pool_dive.py` | `... pool_dive.py -- --estate estate.blend --preview --only 1,60,100,140` |
| `hull_clean.py` | `... hull_clean.py -- --yacht yacht.glb --diver diver.glb --preview --only 1,70,140` |

Every script also accepts `--standin`, which uses test geometry to check the pipeline. **Stand-in frames are never published.**

## Website integration
- Frames go in `public/experiences/<package>/<version>/{d,m}/NNN.webp`:
  - `d` = desktop, 1600×900, WebP quality about 60
  - `m` = mobile, 9:16 center crop, 608×1080, WebP quality about 56
- Each package writes `lib/site/experiences/<package>.json`, for example `{ "frames": 72, "base": "/experiences/car-spin/<version>", "loop": true }`.
- Budget: **≤ 6 MB per package on desktop and ≤ 3 MB on mobile**. Lower frames or quality if a package exceeds that.
- Frames are lazy-loaded (coarse frames first), and there's a static poster for reduced-motion visitors and slow connections, same as the current hero.
- Work on a branch, never `main`. Review on the Vercel preview before merging.

## Assets
- **HDRIs and textures:** polyhaven.com (CC0).
- **Models:** licensed for commercial web use (CGTrader, TurboSquid, Sketchfab "Standard" license). Keep the receipts and licenses in `renders/LICENSES.md`.
  - Remove or replace any logos or badges in the model.
  - Budget: about $150–400 for car, yacht, and house.

## Windows / Blender 5.3 notes (render PC)
- Blender 5.3 at `C:\Program Files\Blender Foundation\Blender 5.3\`; Cycles uses HIP on the RX 7700 XT only (the Ryzen iGPU is skipped automatically).
- Scene scripts are 5.3-compatible (sky/aerosol renames, slotted-action F-curves, geometry-nodes modifier inputs via `mod.properties.inputs`).
- Draft renders: `--samples 128`, every other frame (`--only $(seq -s, 1 2 99)`), then `npm run experience:build -- --src renders/_work/<scene> --name <package> --start 1 --end 99 --step 2 --version <v>`.
- Free assets: Poly Haven CC0 (sky, stone, stucco, roof tiles, marble, furniture, planters) under `renders/_work/assets/polyhaven/`; estate, palms, hedges, furniture and hydrangeas are generated by `renders/scenes/procedural.py`. Licenses: `renders/LICENSES.md`.
- Web players: `components/site/experiences/` (scroll chapter, drag-to-spin); preview page `/the-dive` (noindex).
