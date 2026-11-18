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
3. **The sitemap was unreliable.** `lastmod` changed on every deploy. The sitemap also queried CMS pages that have **no public route**, so any published CMS page would add a 404 URL to it. It also listed `/pricing`. → **Fixed:** the sitemap now lists 11 real, stable URLs: home, services, six service pages, service area, quote, and privacy.
4. **Weak relevance for the searches that matter.** The site targeted generic, heavily contested "cleaning / pressure washing / detailing, Palm Beach County" terms, with one services page and no per-service URLs. → **Fixed:** the site is repositioned around home watch, seasonal prep, hurricane prep, and related services. Each service has its own page, title, and description, aimed at Palm Beach Gardens, Jupiter, North Palm Beach, and Palm Beach.
5. **Structured data was minimal.** The JSON-LD said "cleaning", gave no city-level area, and had no services or FAQ markup. → **Fixed:** added LocalBusiness with four cities in `areaServed` and an offer catalog, plus FAQPage, Service, and BreadcrumbList markup.

## 2. What's broken or risky

- **Discretion breach.** The homepage published before/after photos of a real client property (`/media/curated/estate-cleanup-001/…`, 45 MB). Those files are **still publicly reachable by URL** even though the new design no longer uses them. → Recommend removing `public/media/curated` (needs your OK, since that's a deletion).
- **Brand mismatch.** The logo (`public/logo.png`) shows a squeegee and a work van, which reads as a cleaning company, not a discreet household manager. The new design uses only the text wordmark and a new "PB" monogram for the favicon and schema logo.
- **The quote form asked for a street address and photos.** That adds friction and is a privacy concern for this audience. → The new form asks for the property *area* only, plus the fields you specified.
- **Nobody is notified of quote requests.** → Fixed: requests now email you through Resend **and** still land in Admin → Leads.
- **Prices appeared on a `/pricing` page.** → `/pricing` now redirects (308) to `/quote`. No prices appear anywhere on the public site.
- **Missing favicon** (404 on every page) and **no social share image**. → Fixed.
- **Old service URLs** (`/services/window-cleaning` and others) would 404 after the repositioning. → They now redirect (308) to the closest new page.

## 3. What's slow

- The homepage HTML was **175 KB**, with **30 images**, an autoplaying MP4, and `framer-motion` animations, all on first load.
- Media under `/public` was served with `max-age=0, must-revalidate`, so files were revalidated on every view.
- → **New homepage:** static, 119 KB first-load JS. GSAP loads on demand. Hero frames download only after the first scroll or touch (or 3.5 s idle), coarse frames first. The frame folder is versioned and cached for a year. Lighthouse **mobile**, measured locally on the production build:

| Page | Perf | A11y | Best practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 97 | 100 | 100 | 100 | 2.6 s | 0.03 |
| `/quote` | 98 | 100 | 100 | 100 | 2.3 s | 0 |
| `/service-area` | 97 | 100 | 100 | 100 | 2.4 s | 0 |

## 4. Mobile issues

- `overflow-x: hidden` on `<body>` silently breaks `position: sticky` (the cause of "jumpy" scroll effects on iPhone). → Changed to `overflow-x: clip`.
- Body text was 14–16 px with light grey contrast, which is hard for older readers. → Body text is now 18–20 px, tap targets are at least 48–56 px, and all text passes WCAG AA (Lighthouse accessibility 100).
- The bottom contact bar had three small buttons. → It now has a large **Call 561-629-2617** button and **Get a quote**, always visible on phones.

## 5. Not changed (on purpose)

- The admin app, Supabase schema, and the existing `/api/quote/submit` flow are untouched. The new form writes to the same `quote_requests` table through the existing `submit_public_quote_request` RPC.
- Old marketing components (`components/marketing/*`, `components/media/*`) are now unused by the public pages but were left in place. Nothing was deleted.
