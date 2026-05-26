# PBPP Media Curation System

Automatically curates raw project folders into premium, website-ready media.

## Quick start

### 1. Drop a project folder

```
public/media/projects/estate-cleanup-001/
  metadata.json          ← optional but recommended
  before/                ← raw before photos
  after/                 ← raw after photos
  videos/                ← field video, POV, walkthrough
  drone/                 ← optional drone footage
```

### 2. Import from Desktop (first-time setup)

```bash
npm run media:import
```

This copies `~/Desktop/BEFORE PHOTOS`, `AFTER PHOTOS`, and `VIDEOS` into `estate-cleanup-001`.

Custom paths:

```bash
node scripts/import-desktop-project.mjs my-project-id "/path/to/before" "/path/to/after" "/path/to/videos"
```

### 3. Curate

```bash
npm run media:curate
```

Outputs:

```
public/media/.curated/
  manifest.json
  estate-cleanup-001/
    images/     ← optimized WebP + blur placeholders
    clips/      ← web MP4 loops (requires FFmpeg)
```

The homepage automatically reads `manifest.json` at build time.

## metadata.json example

```json
{
  "title": "Estate vegetation cleanup & exterior restoration",
  "location": "Palm Beach Gardens",
  "division": "exterior",
  "timeframe": "48-hour estate turnaround",
  "tags": ["vegetation removal", "pathway clearing", "landscape refinement"],
  "scope": ["Vegetation trimming", "Debris removal", "Pathway clearing"],
  "summary": "Optional custom summary — otherwise auto-generated."
}
```

## Storytelling priority

The curator optimizes for **homepage immersion, trust, and transformation proof** — not viral social pacing.

### 3-act visual arc

1. **Neglected** — before/ overgrown / pre-scope conditions (`before/` folder)
2. **Active work** — field video and operational movement (`videos/`, `drone/`)
3. **Restored** — clean, open, estate-ready results (`after/` folder)

The homepage `StoryArcShowcase` presents this progression calmly and spaciously.

### Photo cropping

Scoring favors **wide, contextual frames** (estate scale, pathways, landscaping depth). Tight portrait crops are deprioritized for hero and gallery use.

### Homepage video

- Ideal length: **4–12 seconds**
- Landscape, muted autoplay loops
- Natural color only — no flashy cuts or effects
- Prefers stable operational footage over long raw dumps or harsh vertical crops

## Editorial rules (important)

PBPP media should feel **authentic, cinematic, and operational** — not over-produced.

### Photos (automatic)

The curator applies only:

- Mild contrast correction
- Exposure balancing
- Very light sharpening
- Crop / resize optimization
- Subtle warmth via minimal saturation reduction (avoids fake greens)

It avoids:

- HDR crunch
- Oversaturated greens
- Heavy filters
- AI-looking polish

Scoring also **deprioritizes** frames that look over-saturated or unnaturally processed.

### Video (when FFmpeg is installed)

Clips are:

- Trimmed to remove dead space
- Exported with natural color (`saturation ≈ 0.98`, mild contrast)
- Kept smooth — no rapid cuts, meme edits, or flashy transitions
- Prioritized for operational footage (POV, walkthrough, clearing, pressure washing)

### Website presentation

- No Ken Burns on authentic project photos
- No hover zoom on real PBPP media
- Motion is fade-only and slow
- Overlays exist for text readability, not to “re-edit” the photo

## What the curator does

| Step | Description |
|------|-------------|
| Scan | Reads all images/videos in project subfolders |
| Score | Ranks sharpness, brightness, resolution, cinematic aspect |
| Dedupe | Removes duplicate/near-duplicate shots |
| Pair | Matches strongest before/after combinations |
| Process | Generates WebP at hero/gallery sizes + blur placeholders |
| Video | FFmpeg clips + posters (when FFmpeg installed) |
| Manifest | Writes homepage recommendations + project recaps |

## FFmpeg (for video clips)

Install locally:

```bash
brew install ffmpeg
```

Without FFmpeg, photos still curate; video clips are skipped with a warning.

## Adding future projects

1. Create `public/media/projects/your-project-id/`
2. Add subfolders + optional `metadata.json`
3. Run `npm run media:curate`
4. Deploy — no code changes required

## Architecture

- `lib/media-curation/` — ingestion, scoring, pairing, processing
- `lib/media/curated.ts` — manifest loader for the site
- `lib/media/homepage-media.ts` — homepage bundle (authentic vs fallback)
- `components/media/cinematic-project-media.tsx` — UI components
- `scripts/curate-media.ts` — CLI entry
- `scripts/import-desktop-project.mjs` — Desktop import helper

## Production notes

- Raw drops in `before/`, `after/`, `videos/` are gitignored (large files stay local)
- Commit `public/media/.curated/manifest.json` and optimized outputs for deploy
- Re-run `npm run media:curate` after adding new project media
