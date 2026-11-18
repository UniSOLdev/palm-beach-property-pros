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
| Services, FAQ, testimonials, service areas, "How it works" | `lib/site/content.ts` |
| Phone number, site URL, tagline | `lib/site.ts` |
| Detail photos ("Trusted by families" section) | `public/site/details/*.webp` + `lib/site/details.ts` |
| Homepage section layout | `components/site/sections.tsx` |
| Scroll hero | `components/site/scroll-hero.tsx` |

**House rules:** never show prices, never name a club or community, never show a client's home, face, address, gate, or full name.

### Replace the placeholder testimonials
In `lib/site/content.ts` → `TESTIMONIALS`, replace each quote with a real one (first name + area only, with the client's written OK) and set `placeholder: false`. The "Sample" label disappears automatically.

### Replace the placeholder detail photos
Shoot close-ups only (a thermostat, a coded key tag, a report on your phone, shutters, pool equipment, fresh flowers). Export as portrait 4:5 (e.g. 800×1000), save over the files in `public/site/details/` with the same names, and set `placeholder: false` in `lib/site/details.ts`.

## Swapping in the real hero footage

The scroll hero plays an image sequence on a `<canvas>` as the visitor scrolls (GSAP ScrollTrigger). Right now it's a stylized placeholder. To use real footage:

1. Get the clip (see the prompts and specs in the private planning repo, `video-prompts.md`): **16:9, 1920×1080 or 4K, 24/30 fps, 6–10 s, no audio**, with the door kept in the **center third** (phones show a vertical center crop).
2. Install ffmpeg once (`brew install ffmpeg`).
3. Run:
   ```bash
   npm run hero:build -- ~/Downloads/hero.mp4            # 120 frames (default)
   npm run hero:build -- ~/Downloads/hero.mp4 --frames 150 --quality 60
   ```
   This replaces `public/hero/<version>/` with desktop (1600×900) and mobile (608×1080) WebP frames, the posters, and the share image (`og.jpg`), and rewrites `lib/site/hero-manifest.json`. No code changes are needed.
4. Check it with `npm run build && npm start`, then commit `public/hero` and `lib/site/hero-manifest.json`.

Keep the total under about 8 MB per set (the script prints sizes). If it's larger, lower `--quality` or `--frames`.

How it stays fast: the server renders only the first frame (as a normal `<img>`, which is the LCP image) plus the headline. Frames download after the first scroll or touch (or 3.5 s idle), coarse-to-fine, with versioned URLs cached for a year. Visitors with **reduced motion**, **Save-Data**, or a **2G/3G** connection get only the still image.

## Quote form → your email

`POST /api/quote/request` (`lib/site/quote-inquiry.ts`) does two things:
1. emails the request to you through **Resend**, and
2. saves it to Supabase `quote_requests`, so it shows up in **Admin → Leads**.

If either succeeds, the visitor sees "Thank you." If both fail, they're asked to call.

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview), then redeploy:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | from resend.com → API Keys (free tier: 3,000 emails/mo) |
| `QUOTE_TO_EMAIL` | the inbox that should receive requests (comma-separate for several) |
| `QUOTE_FROM_EMAIL` | optional. After you verify `palmbeachpropertypros.com` in Resend (adds DNS records), set e.g. `Palm Beach Property Pros <quotes@palmbeachpropertypros.com>`. Until then it uses `onboarding@resend.dev`, which **only delivers to the email you signed up to Resend with**, so use that address for `QUOTE_TO_EMAIL` at first. |

Spam protection: a hidden honeypot field and a minimum fill time.

## After merge: get indexed by Google

1. **Google Search Console** → add the property `https://www.palmbeachpropertypros.com` (DNS TXT verification at Namecheap) → Sitemaps → submit `sitemap.xml` → URL Inspection → "Request indexing" for `/` and each `/services/...` page.
2. **Google Business Profile** as a *service-area business* (hide your address). Areas: Palm Beach Gardens, Jupiter, North Palm Beach, Palm Beach. Primary category: *House sitter* or *Property management company*; add the services. Link it to the website.
3. Ask happy clients for Google reviews (first name only is fine).
4. Bump `LAST_UPDATED` in `app/sitemap.ts` when you change page copy.
