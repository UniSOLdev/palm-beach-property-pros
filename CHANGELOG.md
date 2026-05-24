# Changelog

## May 24, 2026 — Premium SaaS platform upgrade

### Site Studio / Website Builder (Phases 1–4, 9–10)
- **Premium builder UX** — sticky toolbar, unsaved-changes indicator, tabbed sidebar (Sections / SEO / Theme), click-to-edit preview, polished drag handles, viewport spring animation
- **Expanded section editors** — hero (overlay, alignment, max-width, animation), services (icons, links, card styles, columns), testimonials (photos, carousel), gallery (masonry/grid), CTA (gradients, button themes)
- **AI copy enhancer** — rule-based headline/body/SEO improvements (`lib/cms/ai-copy.ts`)
- **Website health scoring** — live grade panel with SEO, content, media, publish checks
- **SEO scoring panel** — A–F grade, slug validation, character counts, enhance buttons
- **Instant theme switching** — 4 presets (Luxury Coastal, Dark Luxury, Modern Executive, Clean Contractor)
- **Page duplication** — one-click copy with all sections
- **Design system** — `lib/design/tokens.ts`, studio CSS utilities, animation presets

### Admin / Operations (Phases 6, 8)
- **Command palette** — ⌘K global search across admin routes
- **Dashboard analytics** — revenue pipeline chart, 8 metric cards, MoM growth, leads/clients/jobs
- Wider admin layout for all `/admin/website/*` routes

### Public site (Phase 5, 7)
- Scroll-reveal animations on homepage sections (respects reduced motion)
- Polished mobile CTA bar (thumb-friendly 48px targets)
- `sitemap.xml` + `robots.txt` generation

### CMS infrastructure
- `duplicateWebsitePage()` server action
- Extended `getDashboardStats()` with leads, clients, avg ticket, growth

---

## May 24, 2026 — Site Studio production fix

### Root cause
`/admin/website` crashed with **"Could not find the table public.website_pages in the schema cache"** because Site Studio migrations were never applied to production Supabase.

### Fixes
- Added **`20260527120000_site_studio_complete.sql`** — creates `website_pages`, `website_sections`, `website_media`, `website_revisions`, RLS, storage, seeds homepage
- Added **`SITE_STUDIO_DEPLOY.md`** — step-by-step migration + schema cache reload
- Added **`checkSiteStudioHealth()`** — detects missing tables with operator-friendly errors
- Replaced malformed task shortcuts on Site Studio hub with **`SiteStudioHub`** component
- Wider admin layout for builder routes (`max-w-7xl`)
- Added loading skeletons + error boundary for `/admin/website`
- Migrated publish workflow to **`website_revisions`** (legacy `website_publish_history` fallback)
- Added API routes: `/api/admin/website/{pages,sections,publish,media}`
- Added zod validation in `lib/cms/website-schemas.ts`
- Added `rich_text` section type
- Slug editor in builder SEO panel

### Deploy required
Migration **`site_studio_complete`** applied to production Supabase on 2026-05-24 via MCP.

If schema cache errors persist: Supabase Dashboard → Settings → API → **Reload schema**.

---

## May 24, 2026 — Production schema reconciliation audit

### Backend stabilization

- Added **`SUPABASE_AUDIT.md`** — full schema drift analysis (migrations vs types vs app queries)
- Added **`FINAL_AUDIT.md`** — production deploy checklist and admin route audit
- Added **`20260526120000_schema_reconciliation.sql`** — idempotent, transactional migration:
  - Legacy `quote_requests` column renames (preserve data)
  - Website builder tables (guard if missing)
  - `media_assets` metadata extensions
  - Quote e-sign columns + `quote_events`
  - Jobs FK hardening (`quote_id`, `invoice_id`)
  - Storage buckets + consolidated RLS policies
  - HEIC support on `lead-media` bucket
  - `updated_at` triggers via `pbpp_attach_updated_at()`

### Typed DB access layer

- Added **`lib/supabase/queries/`** — centralized selectors and query helpers
  - `client.ts` — `toQueryResult`, `unwrapQuery`
  - `selectors.ts` — canonical column lists (prevents drift like `crew_members.email`)
  - Domain modules: `crew`, `leads`, `clients`, `jobs`, `quotes`, `media`, `website`
- Added **`lib/validation/upload.ts`** — zod upload size/type validation

### Types

- Updated **`lib/supabase/database.types.ts`**:
  - `website_pages`, `website_sections`, `website_section_items`, `website_theme`, `website_publish_history`
  - `media_collections`
  - Extended `media_assets` (alt_text, caption, webp_url, etc.)

### Admin fixes

- **`/admin/crew`** — uses typed `listCrewMembers()` (no invalid `email` column)
- **`listCrewOptions()`** — uses query layer with graceful fallback
- **`media-library` actions** — uses typed `listMediaAssets()`

### Verified

- `npm run build` — pass
- All admin routes compile and render with LoadError boundaries

### Deploy note

Apply `20260526120000_schema_reconciliation.sql` to production Supabase before using website builder or media metadata features. **Do not re-run** `20260524160000_quote_intake_production_repair.sql` on databases with existing lead data.

---

## May 23, 2026 — Admin stabilization

- Centralized admin error logging and query helpers
- `LoadError` retry UI and admin toast notifications
- Fixed `/admin/crew` — removed invalid `crew_members.email` select
- Hardened admin list routes with explicit Supabase error handling
- Jobs page — error banner; search filter
- RLS on `tasks`, `cms_*`, `media_*`
- E-signatures, expense import/scan, public quote/invoice routes
