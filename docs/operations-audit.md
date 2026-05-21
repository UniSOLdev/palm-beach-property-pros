# PBPP Operations Platform Audit

Date: 2026-05-21
Branch: `cursor/pbpp-operational-audit-81b9`

## Scope audited

Audited the merged PBPP operations platform across:

- Public marketing shell and PBPP luxury brand chrome
- Admin shell and mobile operations nav
- Dashboard command center
- Jobs workspace and job CRUD API
- Quote to invoice conversion RPC/API
- Invoice CRUD and public invoice surfaces
- Expense imports, expense analytics, and job-costing schema
- Crew roster, assignments, payout calculators, and inventory links
- Website CMS routes for homepage, media, gallery, reviews, SEO, services, CTAs, and preview
- Supabase migrations and service-role query patterns

## Findings fixed in this pass

### 1. Task workflow gap on jobs

**Finding:** Jobs had quote, invoice, client, crew assignment, notes, and file upload links, but no normalized field task/checklist system. This prevented PBPP from tracking job-specific field work, mobile completion, due times, comments, and task activity.

**Fix:** Added `public.operational_tasks` with job/client/crew relationships, priority ordering, statuses, due times, recurrence metadata, completion photo URL storage, comments, and activity logs. Added authenticated job-scoped task CRUD APIs and a task command center directly inside the job workspace.

### 2. Missing mobile-first task completion UX

**Finding:** Existing job workspace had editable fields but no fast field interaction pattern for technicians.

**Fix:** Added 44px+ mobile controls, one-tap Complete/Reopen, status/priority colors, crew assignment, due-time editing, recurrence selection, comments, photo URL attachment, and drag/drop task priority ordering.

### 3. Dashboard lacked command-center intelligence

**Finding:** Dashboard showed simple entity counts and one profit signal but lacked open balances, paid invoice tracking, task alerts, upcoming jobs, and recent activity.

**Fix:** Expanded dashboard analytics to include paid invoices, open invoice balances, expense totals, profit margin, active jobs, open/blocked/due-today tasks, low-stock alerts, upcoming jobs, quick workflows, and a recent activity feed across jobs, tasks, invoices, and expenses.

### 4. Feedback friction in admin actions

**Finding:** Create-job and CMS bootstrap actions used blocking `alert()` feedback and lacked inline loading/error state.

**Fix:** Replaced alerts with inline state, disabled loading states, and accessible `aria-live` feedback. Create-job now uses Next navigation instead of assigning `window.location.href`.

### 5. Mobile/safety polish

**Finding:** Admin mobile bottom nav did not include safe-area padding. Global focus and reduced-motion behavior were not consistently production-ready.

**Fix:** Added `pb-safe` to the admin mobile bar, global focus-visible styling, reduced-motion handling, and 44px minimum target sizing for shared button classes.

## Operational relationships now present

- Jobs link to clients through `jobs.client_id`.
- Jobs link to quotes through `jobs.quote_id`.
- Jobs link to invoices through `jobs.invoice_id`.
- Invoices link to clients through `invoices.client_id`.
- Invoices retain quote conversion lineage through `invoices.quote_id`, `conversion_snapshot`, and `quote_conversion_audit`.
- Expenses link to jobs through `expenses.job_id`.
- Inventory can link to jobs through `inventory_items.assigned_job_id`.
- Job files link to jobs, clients, and invoices through `job_files`.
- New operational tasks link to jobs, clients, and optionally crew members.
- Dashboard metrics now combine invoice payment status, expenses, task status, jobs, crew, and inventory alerts.

## Remaining TODOs / recommended next passes

1. **True push notifications:** The task system now has the data shape for urgent/blocked/due tasks, but no push-notification provider is wired yet.
2. **Native swipe gestures:** Mobile quick completion is present; full left/right swipe gestures would need a small gesture implementation or dependency.
3. **Direct task photo uploads:** Job-level file upload exists and tasks can store photo URLs; the next step is connecting task attachments directly to the storage upload endpoint.
4. **Invoice due dates and overdue automation:** Dashboard computes open balances by status, but invoice schema does not yet include due dates or automatic overdue transitions.
5. **Reusable service templates/common line items:** Quote/invoice builders exist, but shared saved service-template management should be normalized in Supabase.
6. **E-signature support:** Quote/invoice public views exist; signature capture/storage is not implemented.
7. **Recurring expense materialization:** Expense schema/import supports categorization and job costing; recurring expenses need a scheduler/materialization workflow.
8. **OCR integration:** Receipt upload architecture exists at job-file level; OCR provider integration and metadata extraction remain open.
9. **Google Sheets import:** CSV import exists; Sheets OAuth/API import remains preparation work.
10. **CMS drag/drop sections:** CMS routes exist; homepage section drag/drop ordering should be added in the editor as a dedicated follow-up.
11. **Supabase RLS policy hardening:** Tables have RLS enabled and server uses service role. If browser-side Supabase clients are introduced, explicit least-privilege policies must be added before exposure.

## Verification performed

- Baseline after merging platform foundation: `npm run type-check` passed.
- Baseline after merging platform foundation: `npm run build` passed.
- Final after this audit/fix pass: `npm run type-check` passed.
- Final after this audit/fix pass: `npm run build` passed.
- Final after this audit/fix pass: `npm run lint` passed (with the Next.js deprecation notice for `next lint`).
