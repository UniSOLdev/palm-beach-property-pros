# PBPP Platform Upgrade — Implementation Summary

## Phase 1 — CMS-backed public site

### Public website
- **Homepage hero** — CMS-editable headline, subheadline, CTAs, trust microcopy, and trust chips; defaults match spec
- **Featured services section** — Window detailing and pressure washing promoted near top; DB-driven with static fallback
- **Service pages** — Loaded from `site_services` table; static fallback from `lib/services.ts`
- **Projects portfolio** — `/projects` index and `/projects/[slug]` detail pages
- **Quote form** — Multi-service checkboxes, honeypot spam filter, IP rate limiting, water spigot question for pressure/exterior services
- **Pressure washing water access** — Public copy, FAQ seed, quote form field, admin lead display, alternate-water admin flag

### Admin CMS (`/admin/site/*`)
- **CMS hub** — Central navigation for site management
- **Service Manager** — Edit title, slug, copy, inclusions, add-ons, FAQs, pricing mode/label, water access note, featured/active flags
- **Project Manager** — Create/edit/publish projects with categories, case study copy, testimonial fields
- **Homepage Editor** — Controlled editor for hero, trust, section visibility (not a free-form page builder)
- **Dashboard widget** — New leads, follow-up count, published/draft projects, active services, recent submissions, quick actions
- **Leads pipeline** — Expanded statuses, multi-service display, water spigot answer, alternate-water flag with notes

## Phase 2 — Owner-first field service platform

### Mobile owner workflows
- **Bottom nav** — Home, Leads, Schedule, Jobs, Clients (48px touch targets)
- **Field mode** — `/admin/jobs/[id]/field` — 9-step seamless workflow: start job → before photos → notes → after photos → cover image → AI-assisted description → publish draft project → invoice → review request
- **Job detail** — Field mode entry, Google Maps directions link

### Estimate builder (`/admin/quotes/[id]/edit`)
- Line items, discounts (percent/fixed), tax rate, notes, internal notes, expiration date, deposit fields
- PDF generation, email/SMS share links, convert approved estimate to scheduled job
- Lead → estimate auto-fill via existing `convertLeadToQuote`

### Job scheduler (`/admin/schedule`)
- Day / week / month views, drag-and-drop reschedule, status chips (Scheduled → Invoiced)
- Google Maps navigation from job cards

### Customer CRM (`/admin/clients/[id]`)
- Contact info, property address, jobs, quotes, activity timeline, internal notes, service reminders

### Before/after gallery
- Reusable `BeforeAfterSlider` + `BeforeAfterGallery` components
- Project detail pages show interactive before/after pairs when both phases exist

### Projects DB-first architecture
- **`site_projects`** is the source of truth for all project creation, editing, publishing, and galleries
- Relationships: `site_project_media` → media, `site_project_services` → services, optional `source_job_id` / `client_id` FKs
- Admin project editor includes inline media picker with phase + cover selection
- Field workflow publishes draft projects with job/client links and attached photos
- Homepage recaps, transformations, and before/after sections prefer published DB projects
- Filesystem manifest remains available via `npm run media:import-db` (import only, not runtime reads when DB data exists)
- Dynamic sitemap includes published `/projects/[slug]` routes

### Review automation
- On job completion in field mode: send Google review SMS, thank-you message, mark review completed
- Requires `business_settings.google_review_url`

### Service area manager (`/admin/site/service-areas`)
- CRUD for cities, counties, ZIP codes, SEO copy
- Dynamic public pages at `/service-area/[slug]` + sitemap entries

### Dashboard analytics
- New leads, scheduled jobs, completed jobs, draft/published projects, quote conversion rate

### Optional AI assistant
- `/api/admin/ai-assist` + `AiAssistPanel` for project descriptions, emails, SMS, SEO suggestions (never required)

### Modular platform layer (`lib/platform/*`)
- Shared constants, estimate math, gallery pairing, AI helpers — structured for future LINKR extraction

### Security & performance
- Server-side auth on all admin mutations via `requireOwnerRole()`
- RLS on all new CMS tables; anon read for published/active content only
- Quote form honeypot + rate limit (5/min/IP)
- Static fallback when DB unavailable — site remains functional pre-migration
- Existing media library WebP optimization retained

## Schema Changes & Migrations

Apply in order:

1. `supabase/migrations/20260721120000_site_cms_upgrade.sql`
   - Tables: `user_roles`, `site_services`, `site_service_faqs`, `site_service_media`, `site_projects`, `site_project_media`, `site_homepage_settings`, `site_testimonials`
   - Extends: `quote_requests`, `media_assets`
   - Updates: lead status constraint, `submit_public_quote_request` RPC

2. `supabase/migrations/20260721130000_site_cms_seed.sql`
   - Seeds services (window detailing + pressure washing featured), FAQs, homepage defaults, draft placeholder project

3. `supabase/migrations/20260721140000_platform_upgrade.sql`
   - Quote discount/tax fields; job review tracking; client CRM (`client_activity`, reminders, lifetime value)
   - `service_areas` table + seed cities; RLS policies

4. `supabase/migrations/20260721150000_projects_db_first.sql`
   - Project FKs: `source_job_id`, `client_id`, `legacy_filesystem_id`
   - `site_project_services` junction table; anon read policy for published project media

```bash
npm run db:push
# One-time import from curated manifest (optional):
npm run media:import-db
npm run media:import-db -- --publish
```

## New Environment Variables

No new required variables. Existing Supabase vars remain:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (lead photo uploads)
- `NEXT_PUBLIC_SITE_URL`

## Admin Workflow Instructions

1. **Apply migrations** — Run `npm run db:push` or apply SQL in Supabase dashboard
2. **Assign owner role** — Insert into `user_roles` for your auth user: `INSERT INTO user_roles (user_id, role) VALUES ('<uuid>', 'owner');`
3. **Edit homepage** — `/admin/site/homepage`
4. **Manage services** — `/admin/site/services` → edit Complete Window Detailing and Pressure Washing first
5. **Add real projects** — `/admin/site/projects/new` → upload photos in Media Library → attach (media linking UI next iteration)
6. **Review leads** — `/admin/leads` → status pipeline, water spigot answers, alternate-water flags
7. **Build estimates** — Lead → Estimate → `/admin/quotes/[id]/edit` → send → schedule job
8. **Run jobs on site** — `/admin/jobs/[id]/field` for the full mobile workflow
9. **Schedule** — `/admin/schedule` for calendar drag-and-drop
10. **CRM** — `/admin/clients/[id]` for customer history
11. **Service areas** — `/admin/site/service-areas` for local SEO pages
12. **Media** — `/admin/website/media` for uploads, alt text, optimization
13. **Set Google review URL** — Update `business_settings.google_review_url` in Supabase for review automation

## Deployment Steps

1. Merge PR and deploy to Vercel
2. Run migrations against production Supabase
3. Verify `/`, `/services/window-cleaning`, `/services/pressure-washing`, `/quote`, `/admin/site`
4. Submit test quote with pressure washing selected — confirm water spigot field and admin lead detail

## Remaining Manual Tasks (Owner)

- Replace draft placeholder project with real published case studies and owner-approved photos
- Add real testimonials in admin (none seeded — avoid fake reviews)
- Upload window/pressure-washing project photos; do not mislabel estate cleanup photos
- Assign `user_roles` row for each admin user
- Review and customize seeded service copy in admin
- Set `business_settings.google_review_url` for review request automation

## Known Limitations

- **Project media linking in admin** — Full gallery editor in Project Manager; field mode auto-attaches job photos
- **Filesystem manifest** — Import-only via `npm run media:import-db`; runtime homepage prefers DB when published projects exist
- **Homepage hero image** — Still uses curated filesystem media; `hero_media_id` field ready but hero picker UI not yet in homepage editor
- **Site Studio** — Legacy builder remains separate; published Site Studio pages still not wired to App Router
- **Rate limiting** — In-memory per instance; use Redis/Upstash for multi-region production hardening
- **database.types.ts** — Regenerate after migration: `npx supabase gen types typescript --project-id pfojtrfkeoeymmtkvijo`
- **User roles** — Schema ready for editor/staff; enforcement currently owner/editor for CMS mutations

## Testing Results

| Check | Result |
|-------|--------|
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| Static routes generated | 30+ pages including field mode, schedule, CRM, service areas |
| Media health (build) | OK — 26 referenced curated assets |

## Architecture Audit

See `PHASE1_ARCHITECTURE_AUDIT.md` for pre-upgrade audit and file plan.
