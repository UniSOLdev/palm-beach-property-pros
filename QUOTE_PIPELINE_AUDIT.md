# Quote Intake + Conversion Pipeline Audit

**Date:** May 24, 2026  
**Branch:** `cursor/homepage-hero-pricing-cta-polish`

## Executive summary

The pipeline architecture is correct (`/quote` → `quote_requests` → `/admin/leads` → convert → `/admin/quotes` → public `/view/quote/[publicId]` → invoice). Sync failures were caused by **RLS gaps**, **silent error swallowing**, **incomplete quote conversion**, and **likely unapplied migrations** in production.

---

## Root causes found

| # | Issue | Impact |
|---|--------|--------|
| 1 | **No anon RLS on `quotes` / `quote_items`** | Public quote links returned 404 via anon client |
| 2 | **Public pages used anon Supabase client** | Failed when RLS blocked reads even with valid `public_id` |
| 3 | **`convertLeadToQuote` created quotes without `quote_items`** | Public quotes showed $0 with no line items |
| 4 | **`convertLeadToInvoice` used `redirect()` inside client try/catch** | Invoice conversion appeared to fail in UI |
| 5 | **Errors swallowed in `submitQuoteRequest`** | Form showed generic failure; no Vercel logs |
| 6 | **`quote_requests` migration may not be applied in prod** | Submissions fail; `/admin/leads` empty or errors |
| 7 | **`SUPABASE_SERVICE_ROLE_KEY` required but undocumented for intake** | Production `/quote` fails if env var missing |
| 8 | **`SITE_URL` hardcoded** | Public links wrong in preview/staging if env not set |
| 9 | **No `leads` table** (by design) | Leads = `quote_requests` rows — not a separate table |

No mock/demo data dependencies were found in admin quote/lead routes.

---

## End-to-end flow (verified in code)

```
/quote (FormData)
  └─ submitQuoteRequest() [service role]
       └─ INSERT quote_requests (status: new)
       └─ optional lead-media photos
       └─ INSERT quote_request_activity (system)
       └─ revalidatePath(/admin/leads)

/admin/leads
  └─ listLeads() [authenticated]
       └─ SELECT quote_requests WHERE archived = false

/admin/leads/[id] → Convert
  └─ convertLeadToClient → INSERT clients, link client_id
  └─ convertLeadToQuote → INSERT quotes + quote_items, link quote_id, status → quoted
  └─ convertLeadToInvoice → INSERT invoices + invoice_items, link invoice_id

/admin/quotes
  └─ SELECT quotes + link back to source lead via quote_requests.quote_id

/view/quote/[publicId]
  └─ fetchPublicQuote() [service role, scoped by public_id]

/i/[publicId]
  └─ fetchPublicInvoice() [service role, scoped by public_id]
```

---

## Tables verified

| Table | Role | Notes |
|-------|------|-------|
| `quote_requests` | Intake / leads | Primary lead store — **not** a separate `leads` table |
| `quote_request_activity` | Activity log | notes, status changes, conversions, contacts |
| `clients` | CRM | Created on conversion |
| `quotes` | Estimates | `public_id`, `quote_number`, linked from lead |
| `quote_items` | Line items | Now created on conversion |
| `invoices` | Billing | Created on invoice conversion |
| `invoice_items` | Invoice lines | Service line added on conversion |

---

## Files changed

| File | Change |
|------|--------|
| `lib/pipeline/logger.ts` | **New** — structured pipeline logging |
| `lib/supabase/public-share.ts` | **New** — service-role public share reads |
| `lib/site/actions/submit-quote-request.ts` | Logging, schema hints, returns `leadId` |
| `lib/site/actions/upload-lead-photos.ts` | Logging on upload failures |
| `lib/admin/actions/leads.ts` | Quote items on convert, invoice returns ID, logging, quote public link |
| `lib/site.ts` | `SITE_URL` from `NEXT_PUBLIC_SITE_URL` |
| `app/view/quote/[publicId]/page.tsx` | Service-role fetch + error UI |
| `app/view/quote/[publicId]/error.tsx` | **New** — error boundary |
| `app/i/[publicId]/page.tsx` | Service-role fetch + error UI |
| `components/admin/lead-detail-actions.tsx` | Fix invoice nav, show quote URL on convert |
| `app/admin/leads/[id]/page.tsx` | Public quote link display |
| `app/admin/quotes/page.tsx` | Link back to source lead |
| `app/admin/leads/error.tsx` | **New** — schema-aware error boundary |
| `.env.example` | Document required env vars |

---

## Migrations added

| Migration | Purpose |
|-----------|---------|
| `20260524120000_quote_requests.sql` | `quote_requests`, `quote_request_activity`, `lead-media` bucket |
| `20260524130000_quote_pipeline_public_rls.sql` | **New** — anon SELECT on quotes/items/clients for share links + admin policies |

### Apply in Supabase (production)

```bash
supabase db push
```

Or run both SQL files in the Supabase SQL editor in order.

---

## Vercel environment checklist

Required for full pipeline:

| Variable | Used by |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Admin auth + authenticated reads |
| `SUPABASE_SERVICE_ROLE_KEY` | `/quote` submit, public share pages |
| `NEXT_PUBLIC_SITE_URL` | Public quote/invoice link generation |

---

## Build verification

```
npm run build   ✅ pass
npm run type-check   ✅ pass
```

---

## Remaining issues / follow-ups

1. **Apply migrations to production Supabase** — pipeline will not work until `quote_requests` exists.
2. **Quote pricing** — converted quotes insert a $0 placeholder line item; admin must edit pricing before sending (no quote builder UI yet).
3. **Duplicate clients** — repeat submissions from same phone create separate clients on conversion (no dedup).
4. **Photo bucket** — `lead-media` must exist; created by migration.
5. **Real-time leads** — list refreshes on navigation/revalidation; no live subscription (acceptable for v1).
6. **Legacy `clients` from old form** — pre-pipeline submissions used `referral_source: website_quote_form` on `clients` directly; not migrated into `quote_requests`.

---

## Testing checklist (post-deploy)

- [ ] Submit `/quote` form → appears in `/admin/leads` within same session
- [ ] Convert lead → Estimate → quote appears in `/admin/quotes`
- [ ] Open public link `/view/quote/[publicId]` → renders client + service line
- [ ] Convert lead → Invoice → opens `/admin/invoices/[id]` with draft
- [ ] Check Vercel logs for `[PBPP Pipeline]` on any failure
