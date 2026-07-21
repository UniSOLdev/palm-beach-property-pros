# PBPP CMS Upgrade — Implementation Summary

## Implemented Features

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

```bash
npm run db:push
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
7. **Media** — `/admin/website/media` for uploads, alt text, optimization

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

## Known Limitations

- **Project media linking in admin** — Project form saves copy/state; attach before/after photos via Media Library association in a follow-up UI pass
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
| Static routes generated | 29 pages including `/projects`, CMS admin routes |
| Media health (build) | OK — 26 referenced curated assets |

## Architecture Audit

See `PHASE1_ARCHITECTURE_AUDIT.md` for pre-upgrade audit and file plan.
