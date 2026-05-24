# Supabase Schema Audit — PBPP Operations Platform

**Audit date:** May 24, 2026  
**Scope:** Production schema vs `supabase/migrations/` vs `lib/supabase/database.types.ts` vs app queries

---

## Executive summary

The PBPP app query layer is **aligned with the intended post-repair schema**. Remaining risk is **migration ordering / duplication** in the quote pipeline cluster and **types lag** behind website builder + media extensions (now patched locally).

**Critical action:** Apply `20260526120000_schema_reconciliation.sql` to production Supabase. **Never re-run** `20260524160000_quote_intake_production_repair.sql` on a database with existing lead data (it DROPs `quote_requests`).

---

## Migration inventory

| Migration | Status | Notes |
|-----------|--------|-------|
| `20260520120000_change_orders.sql` | OK | Idempotent |
| `20260521000000_supplies_inventory_upgrade.sql` | OK | Idempotent |
| `20260523120000_admin_stabilization_rls_signing.sql` | OK | RLS + signing_requests |
| `20260524120000_quote_requests.sql` | **Superseded** | Overlaps 241500–241600 |
| `20260524130000_quote_pipeline_public_rls.sql` | **Duplicate** | RLS recreated in 241600 |
| `20260524140000_quote_request_public_submit_rpc.sql` | **Superseded** | RPC rewritten in 241500/241600 |
| `20260524150000_quote_requests_anon_insert_rls.sql` | **Overlaps** | Partial duplicate |
| `20260524160000_quote_intake_production_repair.sql` | **DESTRUCTIVE** | DROP + CREATE quote tables |
| `20260524170000_quote_esignature_system.sql` | OK | Additive e-sign |
| `20260525120000_website_builder.sql` | OK | Website CMS tables |
| `20260526120000_schema_reconciliation.sql` | **NEW** | Idempotent repair — apply this |

### Orphaned / missing baseline

Core tables (`clients`, `jobs`, `quotes`, `invoices`, `expenses`, `crew_members`, `tasks`, `cms_*`) are **not created in repo migrations**. They exist in production from earlier remote migrations. A fresh `supabase db reset` from this repo alone will **not** bootstrap the full schema.

**Recommendation:** Add a `00000000000000_baseline.sql` snapshot from production for greenfield dev (future work).

---

## Table-by-table drift

### LEADS — `quote_requests` / `quote_request_activity`

| Issue | Severity | Resolution |
|-------|----------|------------|
| Legacy columns `full_name`, `service`, `property_address`, `photos[]` | High (prod) | Reconciliation migration renames if present |
| App uses `name`, `service_requested`, `address`, `photo_urls` jsonb | OK | Matches post-241600 schema |
| Table name `lead_activity` requested — actual name is `quote_request_activity` | Info | Document only |
| `photo_urls` typed as `Json`, app uses `string[]` | Low | Use `parsePhotoUrls()` helper |
| HEIC uploads vs bucket MIME allowlist | Medium | Reconciliation adds HEIC to `lead-media` |

**App files:** `lib/admin/actions/leads.ts`, `lib/site/actions/submit-quote-request.ts`, `app/admin/leads/*`

### CLIENTS — `clients`

No column drift. App uses `name` (not `full_name`).  
**Note:** `client_addresses` table referenced in requirements — **does not exist**; address stored on `clients.address`.

### QUOTES — `quotes`, `quote_items`, `quote_events`

| Issue | Severity | Resolution |
|-------|----------|------------|
| E-sign columns (`approval_status`, `signed_*`) | High if 241700 missing | Reconciliation ensures columns |
| `quote_events` table | High if 241700 missing | Reconciliation creates + RLS |
| `quotes.status` vs `approval_status` | Info | Both used; no DB CHECK on status |

### INVOICES — `invoices`, `invoice_items`

No column drift. `invoices.quote_id` exists but rarely set on insert.

### JOBS — `jobs`, `job_photos`, `crew_payouts`

| Issue | Severity | Resolution |
|-------|----------|------------|
| `jobs.quote_id` / `jobs.invoice_id` no FK in types | Medium | Reconciliation adds FKs if missing |
| `job_tasks` table in requirements | Info | App uses `tasks` table with `job_id` |

### CREW — `crew_members`

| Issue | Severity | Resolution |
|-------|----------|------------|
| **`crew_members.email` does not exist** | **Fixed** | Removed from queries; uses `CREW_LIST` selector |
| `crew_assignments`, `crew_time_entries` in requirements | Info | Not in schema; use `crew_payouts` + `tasks.assigned_crew_ids` |

### EXPENSES — `expenses`

No column drift. `expense_categories` / `expense_receipts` are logical (category column + receipt_url), not separate tables.

### MEDIA — `media_assets`, `media_folders`

| Issue | Severity | Resolution |
|-------|----------|------------|
| Missing columns: `alt_text`, `caption`, `city`, `webp_url`, etc. | High if 251200 missing | Reconciliation adds all |
| `media_files` / `media_groups` in requirements | Info | App uses `media_assets` + `before_after_group` |
| Types were stale | **Fixed** | `database.types.ts` updated |

### WEBSITE — `website_pages`, `website_sections`, etc.

| Issue | Severity | Resolution |
|-------|----------|------------|
| Tables missing from types | **Fixed** | Types added |
| Tables missing from prod | High | Apply 251200 + 261200 |
| `website_media` in requirements | Info | Uses `media_assets` + section content JSON |

---

## Broken joins audit

| Join | Status |
|------|--------|
| `quotes` → `clients(name)` | Valid |
| `jobs` → `clients(name)` | Valid |
| `invoices` → `clients(name)` | Valid |
| `quotes` embed `quote_items(...)` | Valid |
| `change_orders` → `jobs`, `clients` | Valid |
| `jobs` → `quotes` / `invoices` embed | **Not available** (FK added, embed possible after regen) |

---

## RLS audit

| Table / Bucket | Policy | Status |
|----------------|--------|--------|
| `quote_requests` | anon INSERT only | OK (241600) |
| `quote_requests` | authenticated ALL | OK |
| `quotes` / `quote_items` | anon SELECT by public_id path | OK (241300/241600) |
| `quote_events` | authenticated + service_role ALL | Reconciliation ensures |
| `website_*` | authenticated ALL | Reconciliation ensures |
| `website_pages` | anon SELECT published only | OK |
| `signing_requests` | anon SELECT pending/signed | OK (231200) |
| `tasks`, `cms_*`, `media_*` | authenticated ALL | OK (231200) |
| Storage `lead-media` | anon INSERT + SELECT | Reconciliation ensures |
| Storage admin buckets | authenticated ALL (6 buckets) | Reconciliation consolidates |
| Storage | service_role ALL | Reconciliation adds |

**Security notes:**
- Public quote/invoice reads use **service role** server-side (`public-share.ts`) — correct.
- Service role never exposed to client.
- Photo append on leads uses service role — correct.

---

## Storage buckets

| Bucket | Public | App usage | Reconciliation |
|--------|--------|-----------|----------------|
| `lead-media` | Yes | Quote photos | Ensures + HEIC MIME |
| `signed-documents` | No | E-sign PDF/signature | Ensures |
| `receipts` | No | Expense receipts | Ensures |
| `job-media` | No | Job photos (signed URLs) | Ensures |
| `cms-media` | Yes | Legacy CMS | Ensures |
| `media-library` | Yes | Website asset manager | Ensures |
| `website-media` (requested) | — | **Not used** | `media-library` is canonical |

---

## RPC functions

| Function | Migration | App usage |
|----------|-----------|-----------|
| `submit_public_quote_request` | 241400–241600 | `submit-quote-request.ts` fallback |
| `mark_quote_viewed` | 241700 | Public quote view |
| `log_quote_event` | 241700 | Available; app inserts directly via service role |

---

## Indexes (missing / recommended)

All critical indexes included in reconciliation migration:
- `quote_requests(status)`, `(created_at DESC)`, partial `(archived)`
- `quotes(public_id)`, `(approval_status)`
- `quote_events(quote_id, created_at DESC)`
- `website_pages(slug)`, `website_sections(page_id, sort_order)`
- `media_assets(folder_id)`, `(created_at DESC)`

---

## Nullable mismatches

| Column | DB | App assumption | Risk |
|--------|-----|----------------|------|
| `quote_requests.name`, `phone`, `service_requested`, `address` | NOT NULL | Required on submit | Low |
| `quotes.approval_status` | NOT NULL default pending | Defaults to pending in UI | Low |
| `crew_members.email` | **Does not exist** | Was queried — **fixed** |

---

## Admin page stability matrix

| Route | Error handling | Empty state | Known issues |
|-------|----------------|-------------|--------------|
| `/admin` | Partial | Yes | Dashboard stats fail silently on sub-query errors |
| `/admin/leads` | LoadError | Yes | Requires quote_requests table |
| `/admin/quotes` | LoadError | Yes | Requires approval columns for badges |
| `/admin/invoices` | LoadError | Yes | — |
| `/admin/jobs` | LoadError | Yes | — |
| `/admin/tasks` | Throws in actions | Yes | — |
| `/admin/expenses` | LoadError | Yes | — |
| `/admin/crew` | LoadError | Yes | **Fixed** (email column) |
| `/admin/website` | LoadError | Yes | Requires website_* tables |
| `/admin/website/media` | Fallback query | Yes | Requires media extension columns for Pro |

---

## Safe migration plan

1. **Apply** `20260526120000_schema_reconciliation.sql` (transactional, idempotent)
2. **Do not re-run** `20260524160000` on prod with data
3. **Regenerate types** from Supabase CLI after apply
4. **Verify** `/admin/leads`, `/admin/crew`, `/admin/website`, `/quote`, `/view/quote/[id]`

---

## Files changed in this audit

- `supabase/migrations/20260526120000_schema_reconciliation.sql` — reconciliation
- `lib/supabase/database.types.ts` — website tables + media extensions
- `lib/supabase/queries/` — centralized typed query layer
- `lib/validation/upload.ts` — upload validation (zod)
- `app/admin/crew/page.tsx` — uses query layer
- `lib/admin/actions/media-library.ts` — uses query layer
