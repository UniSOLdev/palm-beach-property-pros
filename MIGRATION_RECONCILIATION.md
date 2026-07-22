# Migration Reconciliation Report

**Project:** `pfojtrfkeoeymmtkvijo` (palm-beach-property-pros)  
**Date:** July 22, 2026  
**Branch:** `cursor/pbpp-cms-upgrade-c6a1`

## Context

Production records 13 CLI-timestamp migrations (May 20–25) fetched via `supabase migration fetch --linked`. The repo also contained 15 hand-timestamp migrations (May 20–30) never applied to production. This reconciliation removes duplicates/obsoletes and adds one forward-only migration for genuinely missing schema.

**Rules followed:** No reset, no `migration repair`, no edits to production-recorded migrations, no real `db push`.

---

## Classification table (15 pre-July local-only migrations)

| Timestamp | Filename | Class | Production evidence | Schema objects | Action |
|-----------|----------|-------|---------------------|----------------|--------|
| `20260520120000` | `change_orders.sql` | **A** | Identical to `20260520061349` (1-char `;;` diff) | `change_orders`, `change_order_items`, `submit_change_order_approval` | **Removed** — canonical: `20260520061349` |
| `20260521000000` | `supplies_inventory_upgrade.sql` | **A** | Identical to `20260520062010` | `supply_job_usage`, `supplies` columns | **Removed** — canonical: `20260520062010` |
| `20260523120000` | `admin_stabilization_rls_signing.sql` | **A** | Identical to `20260523043856` | `signing_requests`, RLS enable on CMS/media/tasks | **Removed** — canonical: `20260523043856` |
| `20260524120000` | `quote_requests.sql` | **D** | Superset absorbed by `20260524064334` (destructive repair + full pipeline) | `quote_requests`, `quote_request_activity`, `lead-media` bucket | **Removed** — intermediate staging file |
| `20260524130000` | `quote_pipeline_public_rls.sql` | **D** | Block copied verbatim into `20260524064334` § quote-share RLS | `quotes`/`quote_items`/`clients` anon policies | **Removed** — intermediate |
| `20260524140000` | `quote_request_public_submit_rpc.sql` | **D** | RPC included in `20260524064334`; superseded by `20260721120000` RPC signature | `submit_public_quote_request` | **Removed** — intermediate |
| `20260524150000` | `quote_requests_anon_insert_rls.sql` | **D** | Anon insert + trigger in repair; `quote_request_activity_anon_insert` intentionally dropped in prod | anon insert policies, triggers | **Removed** — intermediate |
| `20260524160000` | `quote_intake_production_repair.sql` | **A** | Identical to `20260524064334` | Full quote intake pipeline | **Removed** — canonical: `20260524064334` |
| `20260524170000` | `quote_esignature_system.sql` | **B** | Same schema as `20260524070125`; only delta is stricter `mark_quote_viewed` backfill guard | `quote_events`, `mark_quote_viewed`, `signed-documents` bucket | **Removed** — keep prod `20260524070125` behavior |
| `20260525120000` | `website_builder.sql` | **D** | Production skipped this; applied `20260524080147` Site Studio instead; July CMS adds `site_*` tables | `website_section_items`, `website_publish_history` (legacy) | **Removed** — superseded by Site Studio + `site_*` CMS |
| `20260526120000` | `schema_reconciliation.sql` | **B** | Rollup re-applying content already in fetched prod migrations | jobs FKs, anon lead-media, website builder tables | **Removed** — required fragments moved to `20260721170000` |
| `20260527120000` | `site_studio_complete.sql` | **B** | ~99% identical to `20260524080147`; only extra: `website_media_storage_anon_insert` (admin uploads use authenticated route) | `website_*` tables, `website-media` bucket | **Removed** — canonical: `20260524080147` |
| `20260528120000` | `expense_scanner_production.sql` | **A** | Identical to `20260525160546` | `expense_receipts`, `expense_scan_logs`, receipt buckets | **Removed** — canonical: `20260525160546` |
| `20260529120000` | `receipt_asset_normalization.sql` | **A** | Identical to `20260525165436` | receipt migration tracking tables | **Removed** — canonical: `20260525165436` |
| `20260530120000` | `media_library_persistence.sql` | **C** | Not on production; `20260524080235` covers metadata/collections but not optimization/RLS/HEIC | `optimization_status`, media RLS, HEIC mime | **Removed** — content in `20260721170000` |

---

## Forward reconciliation migration

**File:** `supabase/migrations/20260721170000_repo_production_reconciliation.sql`

Adds only idempotent gaps required by the app and fresh installs:

1. `media_assets.optimization_status` / `optimization_error` (used by admin media library)
2. `service_role` + `anon` RLS on `media_assets` / `media_folders`
3. RLS on `media_collections` (table from `20260524080235` had no policies)
4. `jobs_quote_id_fkey`, `jobs_invoice_id_fkey` (from schema reconciliation rollup)
5. HEIC/HEIF on `lead-media` and `media-library` buckets

**Intentionally excluded** (production canonical or not needed):

- Stricter `mark_quote_viewed` from `20260524170000` — production function is authoritative
- `website_media_storage_anon_insert` — uploads go through authenticated admin API
- `anon_lead_media_*` storage policies — quote photo upload uses service role (`upload-lead-photos.ts`)
- Legacy `website_builder` / `website_publish_history` tables — superseded by Site Studio + `site_*` CMS

---

## Final migration directory order

1. `20260520052729` … `20260525165436` — **13 production canonical** (unchanged)
2. `20260721120000` … `20260721160000` — **July 21 CMS batch** (5 files, pending on production)
3. `20260721170000` — **reconciliation** (1 file, pending on production)

Fresh installs: run all migrations in timestamp order above.

---

## Dry-run command (owner terminal)

```bash
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

Expected pending on production after reconciliation: **6 migrations** (July 21 batch + reconciliation).

Do **not** run real push until dry-run output is clean.
