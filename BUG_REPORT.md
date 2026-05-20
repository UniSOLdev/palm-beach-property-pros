# Bug Report — Overnight Stability Pass

## Fixed in this pass

| ID | Severity | Route | Issue | Resolution |
|----|----------|-------|-------|------------|
| B-001 | High | `/admin/tasks` | Uncaught `spawnRecurringTasks` failure blocked page | try/catch (non-blocking) |
| B-002 | Medium | `/admin`, `/admin/jobs` | Margin ignored crew payouts | `getCrewPayoutTotalsByJob` in rollup |
| B-003 | High | `/admin/supplies` | No operational CRUD | Full `SuppliesManager` + actions |
| B-004 | Low | `/admin/jobs/[id]` | Costing confusion vs list | Explanatory copy + breakdown row |
| B-005 | Low | `/admin/website` | Implied CMS controls live `/` | Lock notice banner |

## Open / known (not fixed — intentional)

| ID | Severity | Area | Issue | Recommendation |
|----|----------|------|-------|----------------|
| B-101 | Critical | Supabase RLS | `tasks`, `cms_sections`, `cms_navigation`, `cms_seo`, `media_folders`, `media_assets` have RLS **disabled** on remote | Add `ENABLE ROW LEVEL SECURITY` + `admin_all` policies in a dedicated migration after testing |
| B-102 | Medium | Clients / crew | List-only; no in-app create/edit | Add minimal forms (NEXT_STEPS) |
| B-103 | Medium | Expenses | No edit/delete on job detail | Inline edit backlog |
| B-104 | Low | Invoices | No payment status toggle in admin UI | Add status dropdown on invoice detail |
| B-105 | Low | Quotes table | Legacy `quotes` exists; UI uses change orders | Document; deprecate quotes when ready |
| B-106 | Low | `job_expense_total` | List uses column; detail uses line items — can drift if expenses deleted outside app | Reconcile function on expense delete (future) |

## Public site

- No bugs filed against marketing routes — **no files modified** in `app/(site)/**` or `components/marketing/**`.
