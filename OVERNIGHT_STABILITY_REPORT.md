# Overnight Stability Report

**Date:** May 21, 2026  
**Scope:** PBPP admin operational platform (no public marketing changes)

## Executive summary

The admin backend was audited route-by-route, with targeted fixes for stability, mobile field use, supplies/inventory CRUD, and job costing clarity. The public homepage lock was verified unchanged.

## What was audited

### Routes (static + build verification)

| Route | Status | Notes |
|-------|--------|-------|
| `/admin` | Pass | Dashboard stats, tasks hub, recurring spawn non-blocking |
| `/admin/login` | Pass | Suspense layout, safe redirect, minimal shell |
| `/admin/tasks` | Pass | Recurring spawn wrapped in try/catch (was unguarded) |
| `/admin/jobs` | Pass | Cards, margin includes crew payouts |
| `/admin/jobs/[id]` | Pass | Command center, costing labels clarified |
| `/admin/jobs/[id]/edit` | Pass | Job edit form |
| `/admin/expenses` | Pass | Client manager + focus query |
| `/admin/invoices` | Pass | List, share links |
| `/admin/invoices/new` | Pass | Invoice builder |
| `/admin/invoices/[id]` | Pass | Print, tasks, duplicate |
| `/admin/clients` | Pass | List + task quick-add |
| `/admin/crew` | Pass | `crew_members` table, error state |
| `/admin/supplies` | **Upgraded** | Full inventory CRUD (was name-only list) |
| `/admin/website` | Pass | CMS + homepage lock notice |
| `/admin/website/media` | Pass | Media library |
| `/admin/change-orders/*` | Pass | Prior sprint; included in build |
| `/i/[publicId]` | Pass | Public invoice (anon RLS) |
| `/co/[publicId]` | Pass | Change order approval (not in audit list but built) |

### Public site protection

- `app/(site)/**` — **not modified**
- `components/marketing/**` — **not modified**
- `npm run verify:public-homepage` — **passed**

## Bugs found

1. **`/admin/tasks`** — `spawnRecurringTasks()` could throw and break the page; dashboard already guarded this.
2. **Dashboard / jobs list margin** — `calculateJobProfit` ignored `crew_payouts` table totals (understated costs).
3. **`/admin/supplies`** — Read-only name cards; no CRUD, no low-stock, no quantity adjust.
4. **Job costing clarity** — Detail view vs list rollup difference not explained (risk of perceived double-count).
5. **Site Studio** — Subtitle implied homepage was CMS-driven (misleading).
6. **RLS (remote)** — `tasks`, CMS, and media tables have RLS disabled per Supabase advisor (documented; not auto-fixed to avoid lockout).

## Bugs fixed

| Fix | Files |
|-----|-------|
| Non-blocking recurring task spawn on tasks page | `app/admin/tasks/page.tsx` |
| Crew payout totals in dashboard + jobs list margin | `lib/admin/crew-payout-totals.ts`, `lib/admin/queries.ts`, `app/admin/jobs/page.tsx` |
| Supplies inventory system (CRUD, low stock, usage) | See migrations + supplies module |
| Cost breakdown labels on job detail | `components/admin/job-detail-view.tsx` |
| Site Studio homepage lock banner | `app/admin/website/page.tsx` |
| Mobile: 16px inputs (iOS zoom), min touch heights, scroll-pt | `app/globals.css`, `admin-shell.tsx`, jobs/supplies UI |
| FAB quick action for supplies | `lib/admin/constants.ts` |

## CRUD operations tested (code/build level)

| Area | Create | Edit | Archive | Reorder | Upload | Filter |
|------|--------|------|---------|---------|--------|--------|
| Tasks | Existing | Existing | Existing | Existing | N/A | Existing |
| Jobs | Supabase/manual | Existing form | N/A | N/A | Photos | List |
| Expenses | Existing | Partial | N/A | N/A | Receipt | Page |
| Invoices | Existing | View/duplicate | N/A | N/A | N/A | List |
| Supplies | **New** | **New** | **New** | N/A | N/A | **New search** |
| CMS sections | Existing save | JSON edit | N/A | N/A | Media lib | N/A |

Manual iPhone CRUD still required (see TEST_RESULTS.md).

## Supabase / RLS

- **Applied migration:** `supplies_inventory_upgrade` — `is_reusable`, `expense_id`, `updated_at`, `supply_job_usage` + RLS policy.
- **Operational tables** (`jobs`, `expenses`, `supplies`, `change_orders`, etc.): RLS enabled with authenticated admin access.
- **Advisory:** Enable RLS on `tasks`, `cms_*`, `media_*` with explicit policies before production hardening (see BUG_REPORT.md).

## Mobile improvements

- 48px+ inputs and buttons (global `admin-input`, sticky bars)
- iOS keyboard: `font-size: 16px` on inputs
- Supplies: card layout, +/- quantity, sticky “Add supply”
- Jobs list: larger tap target on “Job details”
- Main content `scroll-pt-20` for sticky header

## Job costing improvements

- Documented two calculators: `calculateJobProfit` (list/dashboard rollup) vs `calculateJobProfitDetail` (job command center, no `job_expense_total` double-count).
- Dashboard and jobs list now include **crew payout totals** per job.
- Job detail shows cost breakdown footer row and explanatory copy.

## Build results

```
npm run verify:public-homepage  ✓
npm run type-check              ✓
npm run build                   ✓
npm run lint                    ✓
```

## Files changed (summary)

- `app/admin/supplies/page.tsx`
- `app/admin/tasks/page.tsx`
- `app/admin/jobs/page.tsx`
- `app/admin/website/page.tsx`
- `app/globals.css`
- `components/admin/supplies-manager.tsx` (new)
- `components/admin/job-detail-view.tsx`
- `components/admin/admin-shell.tsx`
- `lib/admin/actions/supplies.ts` (new)
- `lib/admin/supply-constants.ts` (new)
- `lib/admin/types-supplies.ts` (new)
- `lib/admin/crew-payout-totals.ts` (new)
- `lib/admin/queries.ts`
- `lib/admin/constants.ts`
- `lib/admin/job-costing.ts`
- `lib/admin/job-profit.ts`
- `supabase/migrations/20260521000000_supplies_inventory_upgrade.sql` (new)

## Migrations added

- `20260521000000_supplies_inventory_upgrade.sql` (applied to remote `pfojtrfkeoeymmtkvijo`)
