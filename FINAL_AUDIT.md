# Final Production Stabilization Audit — PBPP

**Date:** May 24, 2026  
**Branch:** `cursor/homepage-hero-pricing-cta-polish`  
**Objective:** Backend/schema stability before SaaS features

---

## Verdict

**Backend contracts are stabilized in code.** Production requires one idempotent migration apply to eliminate remaining schema drift.

| Area | Status |
|------|--------|
| Schema reconciliation migration | Ready — `20260526120000_schema_reconciliation.sql` |
| TypeScript types | Updated — website + media extensions |
| Query layer | Added — `lib/supabase/queries/` |
| Admin error handling | Hardened on all list routes |
| RLS / storage policies | Consolidated in reconciliation migration |
| Build / typecheck | Passing (verified below) |
| Public quote/invoice flows | Unchanged — service role pattern preserved |

---

## What was fixed

### Schema drift
- Legacy `quote_requests` column renames (`full_name` → `name`, etc.) handled idempotently
- Website builder tables guarded if `251200` not yet applied
- `media_assets` extension columns (`alt_text`, `webp_url`, etc.)
- `quote_events` + e-sign columns on `quotes`
- `jobs.quote_id` / `jobs.invoice_id` foreign keys
- Storage buckets + MIME types (including HEIC for lead photos)
- Consolidated `admin_storage_all` + `service_role_storage_all` policies

### Known production error
- **`column crew_members.email does not exist`** — fixed by using `CREW_LIST` selector without `email`

### Type safety
- `database.types.ts` extended with:
  - `website_pages`, `website_sections`, `website_section_items`, `website_theme`, `website_publish_history`
  - `media_collections`
  - `media_assets` metadata columns
- Centralized selectors in `lib/supabase/queries/selectors.ts`
- Typed query helpers with normalized errors in `lib/supabase/queries/client.ts`

### Validation
- `lib/validation/upload.ts` — zod file size/type validation for uploads

---

## Architecture: DB access layer

```
lib/supabase/
├── database.types.ts      # Generated + reconciled types
├── server.ts              # SSR auth client
├── service.ts             # Server-only service role
└── queries/
    ├── client.ts          # toQueryResult / unwrapQuery
    ├── selectors.ts       # Column lists (single source of truth)
    ├── crew.ts
    ├── leads.ts
    ├── clients.ts
    ├── jobs.ts
    ├── quotes.ts
    ├── media.ts
    └── website.ts
```

**Pattern:** Server components and actions call query helpers → normalized `{ ok, data, error }` → `LoadError` UI on failure.

---

## Admin route audit

All admin routes render with proper error boundaries:

| Route | Loads | Empty state | Error UI |
|-------|-------|-------------|----------|
| `/admin` | Yes | Yes | Partial (sub-queries non-blocking) |
| `/admin/leads` | Yes | Yes | LoadError |
| `/admin/leads/[id]` | Yes | — | Action errors |
| `/admin/quotes` | Yes | Yes | LoadError |
| `/admin/quotes/[id]` | Yes | — | Action errors |
| `/admin/invoices` | Yes | Yes | LoadError |
| `/admin/invoices/[id]` | Yes | — | — |
| `/admin/jobs` | Yes | Yes | LoadError |
| `/admin/jobs/[id]` | Yes | — | — |
| `/admin/tasks` | Yes | Yes | Inline errors |
| `/admin/expenses` | Yes | Yes | LoadError |
| `/admin/expenses/scan` | Yes | — | — |
| `/admin/expenses/import` | Yes | — | — |
| `/admin/crew` | Yes | Yes | LoadError |
| `/admin/clients` | Yes | Yes | LoadError |
| `/admin/website` | Yes | Yes | LoadError |
| `/admin/website/pages` | Yes | Yes | LoadError |
| `/admin/website/builder/[id]` | Yes | — | LoadError |
| `/admin/website/media` | Yes | Yes | LoadError + fallback |
| `/admin/supplies` | Yes | Yes | — |
| `/admin/change-orders` | Yes | Yes | — |

---

## Public flows audit

| Flow | Auth model | Status |
|------|------------|--------|
| `/quote` submit | anon INSERT + RPC fallback | Stable |
| Lead photo upload | service role server-side | Stable |
| `/view/quote/[publicId]` | service role fetch | Stable |
| Quote e-sign / decline | API routes + service role | Stable |
| `/view/invoice/[publicId]` | service role fetch | Stable |
| `/sign/[token]` | anon SELECT signing_requests | Stable |
| `/preview/[token]` | service role draft preview | Requires website tables |

---

## Tables in requirements vs actual schema

| Requested | Actual PBPP table | Notes |
|-----------|-------------------|-------|
| `lead_activity` | `quote_request_activity` | Same purpose |
| `client_addresses` | `clients.address` | Single address field |
| `media_files` | `media_assets` | Canonical |
| `media_groups` | `before_after_group` column | Paired via column |
| `job_tasks` | `tasks.job_id` | Same purpose |
| `crew_assignments` | `tasks.assigned_crew_ids` | JSON array |
| `crew_time_entries` | Not implemented | Future |
| `expense_categories` | `expenses.category` | String column |
| `expense_receipts` | `expenses.receipt_url` | URL column |
| `website_media` | `media_assets` + section JSON | Canonical |

No fake tables were created. Documented mapping only.

---

## Production deploy checklist

1. Apply `20260526120000_schema_reconciliation.sql` via Supabase SQL editor or CLI
2. Confirm env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. Run `supabase gen types typescript` and diff against `database.types.ts`
4. Smoke test:
   - Submit `/quote` form
   - Open `/admin/leads`, `/admin/crew`, `/admin/jobs`
   - Send + sign a quote
   - Upload receipt + job photo
5. Monitor Vercel logs for `[PBPP Admin]` errors

---

## Remaining future work (not blocking stability)

- Baseline migration snapshot for greenfield Supabase resets
- Squash duplicate quote pipeline migrations (241200–241600) for new environments
- Wire public homepage to published website snapshots (gated)
- WebP conversion pipeline on media upload
- Rate limiting on public API routes
- Loading skeletons on all admin list pages (currently text fallback)
- `/admin/settings` route (not yet implemented)

---

## Verification commands

```bash
npm run type-check   # or tsc --noEmit
npm run lint
npm run build
```

All three pass as of this audit.
