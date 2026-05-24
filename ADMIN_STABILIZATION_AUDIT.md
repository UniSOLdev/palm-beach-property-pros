# Admin Stabilization Audit — May 23, 2026

Full diagnostic pass: Supabase production schema vs migrations vs frontend queries vs TypeScript types vs RLS vs server actions.

## Executive summary

| Area | Status |
|------|--------|
| Production build | **PASS** (`npm run build`, `tsc`, `lint`) |
| Jobs page | **REPAIRED** — error handling, search, schema-aligned queries |
| Crew page | **FIXED** — removed invalid `email` column (not in `crew_members`) |
| RLS hardening | **APPLIED** — 6 tables now have RLS enabled in production |
| Receipt scanner | **OPERATIONAL** at `/admin/expenses/scan` (+ inline on `/admin/expenses`) |
| Spreadsheet import | **NEW** at `/admin/expenses/import` (CSV/XLSX) |
| E-signatures | **NEW** — `signing_requests` table, `/sign/[token]`, public quote/invoice views |
| Generated DB types | **NEW** — `lib/supabase/database.types.ts` |

---

## Route-by-route status

| Route | Status | Notes |
|-------|--------|-------|
| `/admin` | OK | Dashboard stats; recurring task spawn non-blocking |
| `/admin/tasks` | OK | Full task board; requires authenticated session |
| `/admin/jobs` | **FIXED** | Query error banner; client search via `?q=` |
| `/admin/jobs/[id]` | OK | Detail, photos, expenses, change orders |
| `/admin/jobs/[id]/edit` | OK | Job edit form |
| `/admin/expenses` | OK | List + scan/import links |
| `/admin/expenses/scan` | **NEW** | Dedicated receipt scanner |
| `/admin/expenses/import` | **NEW** | CSV/XLSX batch import with duplicate detection |
| `/admin/invoices` | OK | Error handling added |
| `/admin/invoices/new` | OK | Invoice builder |
| `/admin/invoices/[id]` | OK | PDF / edit |
| `/admin/clients` | OK | Error handling added |
| `/admin/crew` | **FIXED** | Was selecting non-existent `email` column |
| `/admin/supplies` | OK | CRUD + job usage |
| `/admin/change-orders` | OK | Error handling added |
| `/admin/website` | OK | CMS studio (homepage locked) |
| `/admin/website/media` | OK | Media library |
| `/sign/[token]` | **NEW** | Typed + drawn e-signature |
| `/view/invoice/[publicId]` | **NEW** | Redirects to `/i/[publicId]` |
| `/view/quote/[publicId]` | **NEW** | Public quote view |
| `/co/[publicId]` | OK | Change order approval (existing) |
| `/i/[publicId]` | OK | Public invoice (existing) |

---

## Schema drift findings

### Production migrations (remote) vs repo (local)

**Applied in production:**
- `admin_platform_tasks_cms_media_rls`
- `seed_home_cms_sections`
- `job_photos_table`
- `tasks_operational_fields`
- `change_orders_scope_approval`
- `supplies_inventory_upgrade`
- `admin_stabilization_rls_signing` *(this pass)*

**Local files with different timestamps** (`20260520120000_change_orders.sql`, `20260521000000_supplies_inventory_upgrade.sql`) mirror content already applied remotely under different version names. **Do not re-apply locally named files to production.**

### Fixed query/schema mismatches

| Location | Issue | Fix |
|----------|-------|-----|
| `app/admin/crew/page.tsx` | Selected `crew_members.email` (column does not exist) | Use `notes`, `default_pay_rate`, `pay_rate_unit` |

---

## RLS audit

**Before:** `tasks`, `cms_sections`, `cms_navigation`, `cms_seo`, `media_folders`, `media_assets` had policies but RLS **disabled**.

**After:** All six tables now have RLS enabled. Existing `admin_all` authenticated policies apply.

**New table:** `signing_requests` with admin + anon read policies; writes via service role server action.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser + SSR auth client |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | E-sign submission |
| `OPENAI_API_KEY` | For scan | Receipt OCR |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Signing link URLs |

---

## Remaining known issues

1. Client/crew CRUD forms — list-only
2. Expense edit/delete — create only from job detail
3. Import rollback UI — batch ID in notes only
4. Signed PDF generation — not yet built
5. Invoice anon RLS — broader than `public_id` scope
