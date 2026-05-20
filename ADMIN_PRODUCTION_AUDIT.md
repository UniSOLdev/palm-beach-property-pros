# Admin Production Audit

*Palm Beach Property Pros — stabilization pass (May 20, 2026)*

## Executive summary

The `/admin` backend is **production-ready for field iPhone use** after this pass, with known limitations documented below. Build and type-check pass. Marketing routes unchanged.

| Area | Status |
|------|--------|
| Routes & auth | Pass (fixes applied) |
| Mobile UX | Pass (padding, login shell, touch targets) |
| RLS / security | Pass with notes (public invoice scope) |
| Task system | Pass |
| Job command center | Pass |
| Invoices | Pass |
| Website/CMS | Pass |
| Error handling | Improved |

---

## 1. Route audit

| Route | Status | Notes |
|-------|--------|-------|
| `/admin` | Pass | Dashboard + task hub; recurring spawn non-blocking on failure |
| `/admin/login` | Pass | Minimal layout (no bottom nav/FAB); safe `next` redirect |
| `/admin/tasks` | Pass | `?new=1` opens create modal |
| `/admin/jobs` | Pass | List + per-job quick-add |
| `/admin/jobs/[id]` | Pass | loading/error/not-found; task panel |
| `/admin/jobs/[id]/edit` | Pass | Quick-add task |
| `/admin/expenses` | Pass | `?focus=form` / `?focus=receipt` scrolls form |
| `/admin/invoices` | Pass | Empty states |
| `/admin/invoices/new` | Pass | Empty-client guard |
| `/admin/invoices/[id]` | Pass | Print/share/tasks |
| `/admin/clients` | Pass | List + quick-add |
| `/admin/crew` | **Fixed** | Was querying wrong table `crew` → `crew_members` |
| `/admin/supplies` | Pass | Query errors surfaced |
| `/admin/website` | Pass | CMS JSON editor |
| `/admin/website/media` | Pass | Media library |
| `/i/[publicId]` | Pass | Friendly error if query fails |
| `app/(site)/*` | Pass | Static/SSG marketing unchanged |

**Added:** `app/admin/loading.tsx`, `app/admin/error.tsx` for segment-level fallbacks.

---

## 2. Mobile UX

| Check | Status |
|-------|--------|
| Bottom nav clearance (`pb-36` main, job detail `pb-36`) | Pass |
| Job sticky action bar (`bottom-16`, above nav) | Pass |
| FAB (`bottom-24`, z-50) | Pass |
| Task modal (`z-[60]`, bottom sheet) | Pass |
| 48px buttons (`admin-btn`, nav `min-h-[52px]`) | Pass |
| Login without chrome overlap | **Fixed** |
| FAB quick actions | **Fixed** — query params wired |

---

## 3. Supabase / RLS

| Check | Status |
|-------|--------|
| RLS enabled | Yes (unchanged) |
| Browser uses anon/publishable + session | Yes |
| `service_role` in client bundle | **No** — only in `lib/supabase/env.ts` (unused in app code) |
| Authenticated admin CRUD | Expected via existing policies |
| Public invoice | Anon read on `public_id` match — **review** for stricter RPC |
| Job photo / receipt uploads | Signed URLs for private buckets |
| Crew page data | **Fixed** table name |

---

## 4–7. Feature QA (code review + build)

Automated: `npm run type-check`, `npm run build` (includes ESLint).

**Task system:** CRUD, filters, linked quick-add, job checklist (opt-in), workflow shortcuts (opt-in) — architecture verified.

**Job command center:** Photos, expenses, profit detail (line-item expenses, no double-count with `job_expense_total` on detail). List margin uses `job_expense_total` column — **now synced** when adding job expenses.

**Invoices:** Manual + from job; public template; follow-up tasks on unpaid.

**CMS:** JSON save with parse/save error messages; homepage uses `HOME_CMS_DEFAULTS` fallback.

---

## Fixes applied this pass

1. Login page: no bottom nav/FAB; `safeAdminRedirectPath()` for `?next=`
2. Crew page: `crew_members` table + error UI
3. FAB: `?new=1`, `?focus=form`, `?focus=receipt` handlers
4. Job expense add: updates `jobs.job_expense_total` for list consistency
5. Inline errors: expenses, invoices, CMS, tasks, supplies, public invoice
6. Invoice builder: empty-client guard
7. Admin segment loading/error boundaries
8. Dashboard: non-blocking recurring task spawn

---

## Remaining work (not blockers)

See `UPDATED_REMAINING_ISSUES.md`. Highlights:

- Client/crew/supplies full CRUD UI
- Tighter public invoice RLS
- Quote/change-order builder
- Jobs list vs detail margin still uses different formulas (list = stored totals; detail = live expense rows)

---

## iPhone smoke test

See `QA_RESULTS.md` for Clayton’s step-by-step checklist.
