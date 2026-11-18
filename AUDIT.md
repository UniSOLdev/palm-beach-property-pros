# Website Audit — palmbeachpropertypros.com

_Audited 2026-11-18 against production deployment `eb93dc3` (main). Fixes are on the `redesign` branch._

## Setup at a glance

| Item | Finding |
|---|---|
| Framework | Next.js 15 (App Router), React 19, Tailwind 3, Supabase back end (admin + leads) |
| Hosting | Vercel project `palm-beach-property-pros` (team: unisoldev's projects) |
| Build status | Last 8 deployments **READY**, no build errors |
| Domains | `www.palmbeachpropertypros.com` (primary), apex 308 → www, plus `palm-beach-property-pros.vercel.app`. DNS at Namecheap, verified, **not misconfigured** |
| Env vars (Vercel) | Supabase URL/anon/service role, ADMIN_PASSWORD, OPENAI_API_KEY. **No email provider** is configured, so quote requests go only to the database and nobody is notified. |

## 1. Why the site isn't on Google

The live site is **technically indexable**: pages return 200, `robots.txt` allows crawling, `sitemap.xml` is valid, and there's no `noindex`. A web search for the domain returns **zero** results. So the cause is not a single blocked switch but a combination of problems:

1. **Google has never been told the site exists.** The site has no Search Console verification, no submitted sitemap, no Google Business Profile, and no inbound links. A new domain with no links and no Search Console can sit undiscovered for months. → **You must do this (see README, "After merge").**
2. **A duplicate copy competes with the real site.** `palm-beach-property-pros.vercel.app` serves the full site with no `noindex`, and no page had a `<link rel="canonical">`. Google sees two identical sites and has no signal about which one is real. → **Fixed:** every page now has a canonical URL, and every `*.vercel.app` host sends `X-Robots-Tag: noindex`.
3. **The sitemap was unreliable.** `lastmod` changed on every deploy, and the sitemap queried CMS pages that have **no public route**, so any published CMS page would add a 404 URL to it. → **Fixed:** the sitemap now lists 23 real, stable URLs, including all 17 service pages.
4. **Thin service pages.** → Every service, original and new, has a full page with a unique title, description, canonical URL, and Service and Breadcrumb schema. The new private-client pages target the high-value "home watch Palm Beach Gardens / Jupiter" searches.
5. **Structured data was minimal.** The JSON-LD said "cleaning", gave no city-level area, and had no services or FAQ markup. → **Fixed:** added LocalBusiness with four cities in `areaServed` and an offer catalog, plus FAQPage, Service, and BreadcrumbList markup.

## 2. What's broken or risky

- **Broken images on the live site.** 7 of the 13 hotlinked Unsplash photos in `lib/media/registry.ts` now return 404. → The redesign self-hosts all photography in `public/photos/`.
- **Discretion breach.** The homepage published before/after photos of a real client property (`/media/curated/estate-cleanup-001/…`, 45 MB). Those files are **still publicly reachable by URL** even though the new design no longer uses them. → Recommend removing `public/media/curated` (needs your OK, since that's a deletion).
- **Brand mismatch.** The logo (`public/logo.png`) shows a squeegee and a work van, which reads as a cleaning company, not a discreet household manager. The new design uses only the text wordmark and a new "PB" monogram for the favicon and schema logo.
- **Nobody is notified of quote requests.** → Fixed: the existing quote pipeline now also emails you through Resend, and emails you instead if the database is down.
- **Price figures in `lib/services.ts`** (for example, "often starts around $99") are never rendered on the redesigned site. `/pricing` keeps its URL but lists services with "private quote" only.
- **Missing favicon** (404 on every page) and **no social share image**. → Fixed.
- **All existing URLs are preserved:** the 12 original service pages, `/pricing`, `/quote`, and `/service-area`. Five private-client service pages were added.

## 3. What's slow

- The homepage HTML was **175 KB**, with **30 images**, an autoplaying MP4, and `framer-motion` animations, all on first load.
- Media under `/public` was served with `max-age=0, must-revalidate`, so files were revalidated on every view.
- → **New site:** the homepage is static with 115 KB first-load JS. Self-hosted photography is served as AVIF/WebP at the right size for each screen. GSAP loads only after the first scroll or touch. Lighthouse **mobile**, measured locally on the production build:

| Page | Perf | A11y | Best practices | SEO | LCP |
|---|---|---|---|---|---|
| `/` | 95–96 | 100 | 100 | 100 | 2.8 s |
| `/services/auto-detailing` | 97 | 100 | 100 | 100 | 2.5 s |
| `/quote` | 97 | 100 | 100 | 100 | 2.6 s |
| `/services`, `/pricing` | 94 | 100 | 100 | 100 | 3.0 s |

## 4. Mobile issues

- `overflow-x: hidden` on `<body>` silently breaks `position: sticky` (the cause of "jumpy" scroll effects on iPhone). → Changed to `overflow-x: clip`.
- Body text was 14–16 px with light grey contrast, which is hard for many readers. → Body text is now 18–20 px, tap targets are at least 48–56 px, and all text passes WCAG AA (Lighthouse accessibility 100).
- The bottom contact bar had three small buttons. → It now has a large **Call 561-629-2617** button and **Get a quote**, always visible on phones.

## 5. Not changed (on purpose)

- The admin app, Supabase schema, `/api/quote/submit`, and the `submitQuoteRequest` pipeline are unchanged apart from the added email notification.
- Old marketing components (`components/marketing/*`, `components/media/*`) are now unused by the public pages but were left in place. Nothing was deleted.
