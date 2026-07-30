# Owner content guide — photos, reviews & case studies

Use this checklist while you gather photos from completed jobs. The site is wired to accept your content in a few specific places—no redesign needed.

---

## Quick checklist

| Task | File / folder | Status |
|------|----------------|--------|
| Team or owner photo | `public/media/team/` + `lib/team.ts` | Placeholder on site |
| Replace stock service images | `public/media/stock/services/` + `lib/media/site-imagery.ts` | Stock Unsplash live |
| Add Google reviews | `lib/reviews.ts` | Section hidden until added |
| Add project case study | `lib/case-studies.ts` + `public/media/curated/` | 1 estate project live |
| Enable Google Analytics | `.env` → `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional |
| Merge & deploy PR #20 | GitHub / Vercel | Pending |

---

## 1. Team / owner photo

1. Save a WebP or JPG as `public/media/team/owner.webp` (or similar).
2. Open `lib/team.ts` and set:
   - `photoPath: "/media/team/owner.webp"`
   - `photoAlt` — describe who is in the photo
   - `ownerName` and `ownerTitle` if you want them on `/about`
3. Deploy. Homepage team section and About page update automatically.

---

## 2. Replace stock service images

Stock images are temporary (see `MEDIA_INVENTORY.md`). To swap one:

1. Export your job photo as **WebP**, roughly **1200×800** (landscape).
2. Replace the file under `public/media/stock/services/` (e.g. `window-cleaning.webp`).
3. Update `alt` text in `lib/media/site-imagery.ts` for that image ID so it stays accurate.
4. **Do not** label stock photos as “PBPP project” in alt text unless they are real completed work.

**Priority order:** hero → window cleaning → pressure washing → mobile detailing → residential cleaning.

Regenerate all stock from Unsplash: `npm run media:stock` (only if you need to reset placeholders).

---

## 3. Add Google reviews

1. Open `lib/reviews.ts`.
2. Copy the commented example at the bottom of `CUSTOMER_REVIEWS`.
3. Paste real review text exactly as on Google (no edits that change meaning).
4. Set `published: true`.
5. Deploy — homepage reviews section appears automatically; LocalBusiness schema includes aggregate rating.

---

## 4. Add a new case study (completed job)

### A. Photos

1. Create a folder: `public/media/curated/your-project-slug/images/`
2. Add `before-*.webp` and `after-*.webp` (same angle when possible).
3. Optional: `metadata.json` (see `public/media/curated/estate-cleanup-001/metadata.json`).

### B. Case study entry

1. Open `lib/case-studies.ts`.
2. Add a new object to `CASE_STUDIES` with `published: true`.
3. Set `beforeImage` / `afterImage` paths under `/media/curated/...`.
4. Write honest scope, challenges, and results — no inflated claims.

### C. Homepage behavior

- If the project has a before/after slider in curated media **and** a case study entry, only the **slider** shows on the homepage (no duplicate card).
- Additional published case studies can appear on `/projects/[slug]` and in future project grids.

---

## 5. Google Analytics

1. Create a GA4 property and copy the Measurement ID (`G-XXXXXXXX`).
2. Add to production env: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX`
3. Events already tracked: estimate submit, phone/SMS clicks, service card clicks.

---

## 6. Insurance & trust claims

- Do **not** add “licensed & insured” until coverage is confirmed and wording is approved.
- Trust bullets on service pages use only verifiable claims (`lib/service-trust.ts`).

---

## 7. Deploy

1. Merge [PR #20](https://github.com/UniSOLdev/palm-beach-property-pros/pull/20).
2. Confirm production env vars (Supabase, `NEXT_PUBLIC_SITE_URL`, optional GA).
3. Smoke-test: homepage images, `561-764-7818` on call buttons, quote form, `/about`, `/recurring-lawn-driveway`.

---

## Need help?

Tell your developer (or cloud agent) which items you have ready:

- “Here are 3 Google reviews” → paste into `lib/reviews.ts`
- “Here are window cleaning before/afters” → paths + case study copy
- “Here is our team photo” → file + `lib/team.ts` update

The site structure is ready; content drops in without further layout work.
