# Phase 1 — Architecture Audit (Palm Beach Property Pros)

## Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.3 App Router, React 19, TypeScript 5.8 |
| Database | Supabase PostgreSQL 17 (no ORM) |
| Auth | Supabase Auth (email/password), middleware on `/admin/*` |
| Storage | Supabase Storage (multi-bucket) + static `public/media/curated/` |
| Hosting | Vercel |
| Styling | Tailwind CSS 3.4, Framer Motion |
| Validation | Zod 4 |
| Images | Sharp, WebP/AVIF via Next.js Image |

## Existing Architecture (Retained)

### Public site
- **Homepage** (`PremiumHomePage`) — locked premium design with curated filesystem media
- **Service pages** — static `lib/services.ts` (9 services), pre-rendered
- **Quote form** — Supabase `quote_requests` with RPC + photo uploads to `lead-media`
- **Public docs** — quote/invoice/change-order e-sign flows (fully wired)

### Admin ops platform
- Dashboard, tasks, jobs, expenses (OCR), invoices, quotes, change orders, supplies, crew, clients
- **Leads pipeline** — `quote_requests` + activity log
- **Media Library Pro** — `media_assets` + `media-library` bucket with WebP optimization
- **Site Studio** — visual page builder (separate from homepage; publish not wired to public routes)

### Security (existing)
- RLS: `authenticated` full access on admin tables; anon selective for public flows
- Service role for trusted server uploads and public share reads
- Middleware session refresh on admin routes

## Gaps Identified

| Area | Current state | Required change |
|------|---------------|-----------------|
| Services | Static TS module | DB-backed `site_services` with admin editor; static fallback |
| Projects | Filesystem manifest only | DB-backed `site_projects` with galleries |
| Homepage copy | Hardcoded in component | Controlled `site_homepage_settings` editor |
| Lead statuses | 6 statuses (`quoted`, `won`) | 8 statuses per spec + water spigot field |
| Quote form | Single service select | Multi-service + water spigot + rate limiting |
| Admin dashboard | Ops-focused only | Add CMS metrics (leads, projects, services) |
| User roles | Any auth user = admin | `user_roles` table with owner role |
| Media library | Partial metadata | Extended fields: public/private, gallery phase, derivatives |

## Bugs & Technical Debt (Pre-upgrade)

1. Site Studio publish not wired to public App Router pages
2. `cms_navigation` not connected to public header
3. Admin auth bypass when Supabase env missing
4. Lead photos silently fail without service role key
5. Quote form service list duplicated from `lib/services.ts`
6. `database.types.ts` stale vs latest migrations

## Proposed Schema Changes

See migration `supabase/migrations/20260721120000_site_cms_upgrade.sql`:

- `site_services`, `site_service_faqs`, `site_service_media`
- `site_projects`, `site_project_media`
- `site_homepage_settings`, `site_testimonials`
- `user_roles`
- Extend `quote_requests`, `media_assets`
- Update `submit_public_quote_request` RPC

## URL Preservation

- `/`, `/services`, `/services/[slug]`, `/quote`, `/pricing`, `/service-area` — unchanged paths
- New: `/projects`, `/projects/[slug]` for portfolio
- New admin: `/admin/site/*` for CMS (separate from Site Studio)

## Implementation Plan (File-by-File)

### Database & types
- `supabase/migrations/20260721120000_site_cms_upgrade.sql`
- `lib/supabase/database.types.ts` — new table types
- `lib/site-content/types.ts` — shared CMS types
- `lib/site-content/queries.ts` — public read queries with static fallback
- `lib/site-content/seed.ts` — seed helpers

### Admin actions
- `lib/admin/actions/site-services.ts`
- `lib/admin/actions/site-projects.ts`
- `lib/admin/actions/site-homepage.ts`
- `lib/admin/actions/leads.ts` — extend for new fields/statuses
- `lib/admin/lead-constants.ts` — new statuses
- `lib/admin/queries.ts` — CMS dashboard stats

### Admin UI
- `app/admin/site/page.tsx` — CMS hub
- `app/admin/site/services/*` — service manager
- `app/admin/site/projects/*` — project manager
- `app/admin/site/homepage/page.tsx` — homepage editor
- `app/admin/site/leads-dashboard.tsx` — enhanced overview widget
- `components/admin/site-*` — form components

### Public site
- `components/marketing/premium-home-page.tsx` — CMS-driven hero + featured sections
- `app/(site)/services/[slug]/page.tsx` — DB content with static fallback
- `app/(site)/projects/*` — portfolio pages
- `app/(site)/quote/quote-form.tsx` — multi-service + water spigot
- `lib/site/actions/submit-quote-request.ts` — extended payload + honeypot

### Security
- `lib/admin/auth.ts` — role check helper
- Rate limiting in quote submit action
