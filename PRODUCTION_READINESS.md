# Production Readiness Report — Projects DB-First Architecture (PR #18)

**Branch:** `cursor/pbpp-cms-upgrade-c6a1`  
**Date:** July 21, 2026  
**Scope:** CMS-backed projects, media relationships, homepage DB-first mode, admin workflow polish

---

## Executive Summary

This PR migrates portfolio projects from filesystem manifest to Supabase as the single source of truth. Production-readiness work in this pass focused on deployment stability, data integrity, admin UX gaps, query correctness, and removing runtime dependence on the curated manifest when published DB projects exist.

**Vercel build:** Passing (root cause of prior failure was ESLint `@next/next/no-html-link-for-pages` in `invoice-builder.tsx` — fixed with Next.js `Link`).

**Recommended merge posture:** Merge after applying migrations to production Supabase and running the manual E2E checklist below with owner credentials.

---

## What Was Fixed in This Pass

### Deployment
- Confirmed clean `npm run build` after ESLint fix
- Added static verification script (`npm run verify:project-workflow`) for CI/deploy checks

### Database
- New migration `20260721160000_projects_production_hardening.sql`:
  - RLS on `site_project_services` (admin, service_role, anon read for published projects)
  - Unique partial index on `source_job_id` (one portfolio entry per job)
  - Indexes for featured queries, sitemap `updated_at`, and media asset reverse lookups

### Project save pipeline (`lib/admin/actions/site-projects.ts`)
- Server-side validation (title, slug format, summary required to publish)
- Cover image always synced into `site_project_media` junction
- Duplicate media assets deduplicated on save
- `is_featured` cleared on detached media via project-scoped reset
- Slug-change revalidation (old + new paths)
- `unpublishProject` and improved `deleteProject` with path revalidation
- Batched reorder error handling

### Homepage / public reads
- When any published DB project exists, homepage **skips filesystem manifest** entirely
- Pinned `featured_project_ids` resolved via `getSiteProjectsByIds` (not limited to top-N query)
- Hero image uses DB project cover (`media.heroImageSrc`) instead of static fallback when in DB mode
- Removed hardcoded `/media/curated/estate-cleanup-001/...` recap fallback

### Admin UX
- Service assignment picker (links to `site_project_services`)
- Delete and unpublish actions on edit page
- Client + server validation with helpful errors
- Empty states on projects list and media editor
- Duplicate media prevention in gallery picker
- Field workflow button renamed to “Create draft portfolio entry”

---

## E2E Workflow Verification

### Automated (this environment)
| Check | Status |
|-------|--------|
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| `npm run verify:project-workflow` | Pass |

### Manual (requires Supabase + owner auth on preview/production)

Run after `npm run db:push` and optional `npm run media:import-db -- --publish`:

1. **Create project** — `/admin/site/projects/new` → save draft
2. **Attach media** — add library assets, set cover, assign phases
3. **Assign services** — toggle linked CMS services
4. **Publish** — Save & publish
5. **Homepage** — project appears in recaps / featured section (DB mode active)
6. **`/projects`** — card visible with cover image
7. **Detail page** — `/projects/[slug]` loads gallery, before/after, testimonial
8. **Edit persistence** — change title/summary, save, refresh public page
9. **Media survives edits** — re-save without touching gallery; images remain
10. **Unpublish + delete** — unpublish removes from public routes; delete removes from admin list

> Preview deployments are SSO-protected. Live browser E2E must be run by the repo owner with Vercel preview auth and Supabase env vars configured.

---

## Database Audit

| Area | Status | Notes |
|------|--------|-------|
| Single source of truth | ✅ Runtime | Published projects read from DB; manifest is import-only |
| Dead code | ⚠️ Partial | Manifest loaders remain for bootstrap/import; not used when DB has published projects |
| Foreign keys | ✅ | `source_job_id`, `client_id`, junction tables with CASCADE |
| RLS | ✅ | All project tables including `site_project_services` |
| Indexes | ✅ | Slug, published+sort, featured, updated_at, media asset lookup |
| N+1 queries | ⚠️ Acceptable | Public list uses batched media fetch; admin save still loops media_asset updates (bounded by gallery size) |
| Transactions | ⚠️ Gap | Supabase JS client has no multi-statement transaction; partial writes possible on mid-save failure |

---

## Performance Notes

- Homepage avoids manifest disk I/O when DB projects exist (`hasPublishedSiteProjects` gate)
- Project index and detail pages use `loading="lazy"` on gallery images
- Featured project pin query fetches only requested IDs
- `getSiteProjectsWithMedia` batches junction + cover queries (2 extra queries per list, not N+1)

**Lighthouse:** Not run in cloud agent environment (SSO + no browser). Recommend owner run on preview after merge.

---

## Remaining Technical Debt

1. **`database.types.ts` out of date** — Regenerate from Supabase after migrations (`supabase gen types`)
2. **No DB transaction wrapper** — Consider Postgres RPC for atomic project+media saves
3. **`media_assets.project_id` dual-write** — Junction table is canonical; consider deprecating `project_id` on assets
4. **Duplicate project shares media assets** — Acceptable for now; true clone would copy storage objects
5. **Homepage legacy sections** — Story arc, reel clips, service-line manifest images still unavailable in pure DB mode (intentional; uses registry fallbacks)
6. **Featured project ordering** — Pinned IDs preserve homepage settings order; no drag-reorder UI yet
7. **Import script idempotency** — Re-running `media:import-db` should be tested on staging

---

## Known Limitations

- First published project switches homepage to DB mode; curated manifest hero clip/story arc no longer shown
- Projects without before+after phased media won't show transformation carousel entries
- `generateStaticParams` for project slugs requires build-time Supabase access
- Field workflow creates **draft** projects; owner must publish in CMS
- AI assist, estimates, and CRM features from Phase 2 are separate from this projects architecture review

---

## Before Real Customers

- [ ] Apply all migrations (`20260721120000` through `20260721160000`) on production Supabase
- [ ] Run owner E2E checklist on production/staging
- [ ] Regenerate TypeScript database types
- [ ] Import or manually create real project content with approved client photos
- [ ] Verify RLS with anon key (public pages) and authenticated owner (admin)
- [ ] Confirm `NEXT_PUBLIC_SITE_URL`, Supabase keys, and Vercel env vars on production
- [ ] Run Lighthouse on homepage + project detail after real media is live

---

## Recommended Next Priorities

1. **Postgres RPC for `save_project`** — atomic save with rollback
2. **Project reorder UI** — drag-and-drop sort_order in admin list
3. **Regenerate `database.types.ts`** in CI after migration push
4. **E2E Playwright suite** — project CRUD against staging Supabase
5. **Deprecate `media_assets.project_id`** — junction-only model
6. **Homepage hero CMS field** — allow hero_media_id override independent of featured project cover
7. **LINKR extraction** — move `lib/platform/modules/projects.ts` patterns into shared package

---

## Migration apply status (agent run)

**Blocked — Supabase CLI not authenticated in cloud agent environment.**

| Check | Result |
|-------|--------|
| Config project ref (`supabase/config.toml`) | `pfojtrfkeoeymmtkvijo` |
| Expected production URL (`.env.example`) | `https://pfojtrfkeoeymmtkvijo.supabase.co` |
| Project name in config comment | `palm-beach-property-pros` (us-west-1) |
| Local link file (`supabase/.temp/project-ref`) | Not present |
| `SUPABASE_ACCESS_TOKEN` | Not set |
| Supabase MCP | `needsAuth` |

**Owner action required before migrations can be applied:**

```bash
npx supabase login
# Opens browser — or set a personal access token:
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxx   # from https://supabase.com/dashboard/account/tokens

cd palm-beach-property-pros
npm run db:push          # applies through 20260721160000 (no reset/reseed)
npm run db:types         # regenerates lib/supabase/database.types.ts
npm run verify:project-workflow
npm run build
```

To inspect pending migrations without applying:

```bash
npx supabase link --project-ref pfojtrfkeoeymmtkvijo
npx supabase migration list
```

**Do not** run `supabase db reset` on production.

---

## Owner E2E checklist (preview)

Preview deployments are SSO-protected. Confirm Vercel env vars include:

- `NEXT_PUBLIC_SUPABASE_URL=https://pfojtrfkeoeymmtkvijo.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production anon/publishable key)
- `SUPABASE_SERVICE_ROLE_KEY` (server/admin only)

After `npm run db:push`, use the Vercel preview URL for branch `cursor/pbpp-cms-upgrade-c6a1`:

| Step | Route / action |
|------|----------------|
| 1. Create draft | `/admin/site/projects/new` → fill title, slug, summary → **Save draft** |
| 2. Attach media | Same page → **Add media** → set phases + cover |
| 3. Assign services | Toggle **Linked services** checkboxes → save |
| 4. Publish | **Save & publish** |
| 5. Homepage | `/` → project in featured/recap section |
| 6. Projects index | `/projects` → card with cover |
| 7. Detail page | `/projects/{slug}` → gallery + before/after |
| 8. Edit persists | `/admin/site/projects/{id}` → change title → save → refresh public page |
| 9. Media survives edit | Re-save without touching gallery → images remain |
| 10. Unpublish | **Unpublish** → confirm removed from `/` and `/projects` |
| 11. Republish | **Save & publish** → confirm returns on public routes |
| 12. Delete | **Delete project** → confirm gone from admin + public |

---

## Environment Variables

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (admin/import) |
| `NEXT_PUBLIC_SITE_URL` | Yes (sitemap, OG) |

---

## Migration Order

```bash
npm run db:push
# optional one-time content import:
npm run media:import-db -- --publish
```

Migrations apply in timestamp order through `20260721160000_projects_production_hardening.sql`.
