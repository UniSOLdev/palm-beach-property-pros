# Job Detail System Report

**Date:** May 20, 2026  
**Route:** `/admin/jobs/[id]`  
**Status:** Implemented — build & typecheck pass

## Summary

The job detail page is now the field **command center** for a single job: financials, scope, photos, expenses, crew payouts, and quick actions. It uses existing admin auth, Supabase RLS, and the `job-media` storage bucket.

## Routes added

| Route | Purpose |
|-------|---------|
| `/admin/jobs/[id]` | Job command center |
| `/admin/jobs/[id]/edit` | Edit job fields & cost inputs |
| `/admin/jobs/[id]/loading` | Skeleton loading state |
| `/admin/jobs/[id]/error` | Client error boundary with retry |
| `/admin/jobs/[id]/not-found` | Archived/missing job |

## Database

### New table: `job_photos`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `job_id` | uuid | FK → `jobs`, cascade delete |
| `category` | text | `before`, `after`, `receipt`, `general` |
| `storage_path` | text | Path in `job-media` bucket |
| `file_url` | text | Signed URL (7-day at upload) |
| `created_at` | timestamptz | |

RLS: `admin_all` for `authenticated` (same pattern as other admin tables).

### Legacy support

Jobs still have `before_photo_urls` / `after_photo_urls` arrays. Those URLs are merged into the photo grid as **Legacy** items (remove via Supabase only).

## Features delivered

### Layout & data
- Service type, client, address, status, schedule, scope, internal notes, created date
- Revenue, total cost, profit, margin (computed)
- Cost breakdown: linked expenses, crew payouts, direct job cost fields

### Profit calculation (`lib/admin/job-profit.ts`)

Does **not** double-count `jobs.job_expense_total`. Uses:

- Sum of `expenses` where `job_id` matches
- Sum of `crew_payouts` for the job
- Job columns: labor, materials, fuel, dump, truck rental, equipment

General business expenses without `job_id` are excluded.

### Photos
- Upload to `job-media` bucket: `jobs/{jobId}/{category}/{uuid}`
- Categories: before, after, receipt, general
- Camera/gallery via `capture="environment"`
- Grid with remove (non-legacy rows delete storage + DB row)
- Signed URLs for private bucket reads

### Job expenses
- Lists job-linked expenses
- Inline add form with optional receipt upload to `receipts` bucket
- Subtotal on page

### Actions (sticky bar above bottom nav)
- **Edit job** → `/admin/jobs/[id]/edit`
- **Upload photos** → `#photos` anchor
- **Create invoice** / **View invoice** — uses `invoices.job_id`, links `jobs.invoice_id`
- **Quote (soon)** — disabled placeholder (no broken navigation)
- **Print summary** — print CSS targets `#job-print-area`

### Invoice integration
- `createInvoiceFromJob(jobId)` prefills client, line item from service + revenue, sets `job_id` and `jobs.invoice_id`
- Existing invoice builder unchanged

## Files added/updated

**New**
- `app/admin/jobs/[id]/page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- `app/admin/jobs/[id]/edit/page.tsx`
- `components/admin/job-detail-view.tsx`
- `components/admin/job-edit-form.tsx`
- `lib/admin/actions/jobs.ts`
- `lib/admin/types-jobs.ts`
- `lib/admin/job-profit.ts`

**Updated**
- `lib/admin/upload.ts` — signed URLs for `job-media` / `receipts`
- `lib/admin/actions/invoices.ts` — optional `job_id` on draft create
- `app/globals.css` — print styles for job summary

## QA results

| Check | Result |
|-------|--------|
| `npm run build` | Pass |
| `npm run type-check` | Pass |
| `/admin/jobs` list links to detail | Yes |
| Marketing routes in build output | Unchanged |
| Photo upload (live) | Requires authenticated user + Storage RLS; verify on device with real job |

## Photo upload verification notes

Upload will work when:

1. Admin user is signed in (JWT on storage requests)
2. `job-media` bucket exists (migration applied)
3. Storage policy `admin_storage_all` allows authenticated CRUD on `job-media`

If upload fails, check Supabase Dashboard → Storage → Policies and Auth session in browser.
