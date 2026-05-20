# Test Results — Overnight Stability Pass

**Environment:** Local build + Supabase remote `pfojtrfkeoeymmtkvijo`  
**Date:** May 21, 2026

## Automated

| Command | Result |
|---------|--------|
| `npm run verify:public-homepage` | **PASS** |
| `npm run type-check` | **PASS** |
| `npm run build` | **PASS** (all admin + `/co` + `/i` routes compile) |
| `npm run lint` | **PASS** |

## Route load (build / static analysis)

All listed admin routes present in Next.js build output as dynamic (`ƒ`) or static where expected. No missing import or server/client boundary errors in build.

## CRUD — code path review (not live browser)

| Flow | Verified in code |
|------|------------------|
| Admin login → session redirect | Middleware + login page |
| Task create/complete/archive | `lib/admin/actions/tasks.ts` |
| Job expense add + `job_expense_total` sync | `addJobExpense` |
| Invoice from job | `createInvoiceFromJob` |
| Supply create/edit/archive | `saveSupply`, `archiveSupply` |
| Supply qty +/- | `adjustSupplyQuantity` |
| Supply job usage log | `logSupplyJobUsage` |
| Change order approval RPC | Prior migration |

## Manual testing still required (iPhone)

- [ ] Sign in on cellular; session persists after backgrounding
- [ ] Create supply item outdoors; +/- quantity with gloves
- [ ] Log supply usage against active job
- [ ] Low-stock banner + restock task shortcut
- [ ] Job detail profit cards readable in sunlight
- [ ] Sticky bottom bars clear of home indicator (FAB + job bar + supply bar)
- [ ] Expense receipt upload from camera
- [ ] Public `/i/` and `/co/` links open without admin login
- [ ] Confirm homepage on production URL still premium dark hero

## Regression: public homepage

- Script confirms `app/(site)/page.tsx` uses `PremiumHomePage` only (no CMS fetch on `/`).
