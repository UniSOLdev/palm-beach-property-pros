# Palm Beach Property Pros — website

Next.js 15 site + admin for Palm Beach Property Pros LLC. Public pages live in `app/(site)`; the admin (leads, jobs, invoices, CMS) lives in `app/admin`.

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # production build (must pass before merging)
```

See `AUDIT.md` for the November 2026 audit and what the redesign fixed.

## Editing the public site

| What | Where |
|---|---|
| Service catalog (names, copy, photos, categories) | Core services: `lib/services.ts`. Private-client services: `lib/site/content.ts`. Merged and categorized in `lib/site/catalog.ts` |
| FAQ, testimonials, signature service areas, "How it works" | `lib/site/content.ts` |
| Phone, site URL, tagline, county city list | `lib/site.ts` |
| Homepage sections | `components/site/sections.tsx` |
| Scroll hero | `components/site/scroll-hero.tsx` (photo mode) and `components/site/sequence-hero.tsx` (footage mode) |
| Photography | `public/photos/*.jpg` |

**House rules:** never show prices (the old `startingPriceLabel` values in `lib/services.ts` are deliberately never rendered); never name a club or community; never show a client's home, face, address, gate, plate, or full name.

**Service URLs are preserved.** All 12 original `/services/<slug>` pages still exist, and so do `/pricing` (now "private quotes", with no figures) and `/quote`. Five private-client services were added: `/services/home-watch`, `/arrival-departure`, `/hurricane-prep`, `/vendor-coordination`, and `/concierge`.

### Photography
The current images are licensed stock from Unsplash (Unsplash License: free for commercial use, no attribution required). They're stored in `public/photos/` so the site never depends on a third-party URL that could disappear. Seven of the old hotlinked Unsplash images had already been removed and were showing as broken.

**Recommended next step:** a half-day professional shoot of *your own* crew, vehicles, and equipment at work, plus detail shots: hands, tools, finished surfaces, never client faces or addresses. Replace the files in `public/photos/` with the same names and dimensions (landscape 3:2, at least 2400 px wide), or update the paths in `lib/site/catalog.ts`.

### Testimonials
`TESTIMONIALS` in `lib/site/content.ts` are samples (`placeholder: true`). **They appear on preview deployments only and never in production** (`VERCEL_ENV === "production"` hides them). Replace them with real first-name quotes and set `placeholder: false`.

## Hero footage

The homepage hero is a scroll-driven sequence built from photography: a push toward the estate at golden hour, then a dissolve to the interior. To swap in real drone or AI footage (specs in the private planning repo, `video-prompts.md`):

1. Install ffmpeg (`brew install ffmpeg`).
2. Run:
   ```bash
   npm run hero:build -- ~/Downloads/hero.mp4                 # 120 frames
   npm run hero:build -- ~/Downloads/hero.mp4 --frames 150 --quality 60
   ```
   This writes desktop (1600×900) and mobile (608×1080) WebP frames to `public/hero/<version>/` and sets `lib/site/hero-manifest.json` to `"mode": "sequence"`. The homepage then switches to the frame-sequence hero automatically.
3. To go back to the photo hero, set `"mode": "photo"` in the manifest.

Both modes render the first image server-side (good for LCP and SEO). GSAP loads only after the first scroll or touch (or 4 s idle). Visitors with reduced motion, Save-Data, or a 2G/3G connection get a static hero.

## Quote form → your email

The form at `/quote` (`components/site/quote-form.tsx`) uses the **existing** `submitQuoteRequest` pipeline, so leads, photo uploads, UTM source, and the Admin → Leads board all work as before. New in the redesign:

1. **Email notification.** Every saved lead is also emailed to you through Resend, with a link to the lead in Admin.
2. **Email fallback.** If the database is ever unavailable, the request is emailed instead, so it isn't lost.

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview), then redeploy:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | from resend.com → API Keys (free tier: 3,000 emails/mo) |
| `QUOTE_TO_EMAIL` | the inbox that should receive requests (comma-separate for several) |
| `QUOTE_FROM_EMAIL` | optional. After you verify `palmbeachpropertypros.com` in Resend (adds DNS records), set e.g. `Palm Beach Property Pros <quotes@palmbeachpropertypros.com>`. Until then it uses `onboarding@resend.dev`, which **only delivers to the email you signed up to Resend with**, so use that address for `QUOTE_TO_EMAIL` at first. |


## After merge: get indexed by Google

1. **Google Search Console** → add the property `https://www.palmbeachpropertypros.com` (DNS TXT verification at Namecheap) → Sitemaps → submit `sitemap.xml` → URL Inspection → "Request indexing" for `/` and each `/services/...` page.
2. **Google Business Profile** as a *service-area business* (hide your address). Areas: Palm Beach Gardens, Jupiter, North Palm Beach, Palm Beach. Primary category: *House sitter* or *Property management company*; add the services. Link it to the website.
3. Ask happy clients for Google reviews (first name only is fine).
4. Bump `LAST_UPDATED` in `app/sitemap.ts` when you change page copy.
