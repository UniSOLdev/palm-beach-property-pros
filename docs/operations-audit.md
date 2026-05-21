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

## 2026-05-21 follow-up pass

### Additional fixes

- Added `public.operational_activity` for relational activity events with job/client/task/invoice/expense links, actor attribution, metadata, timestamps, and dashboard/job feed support.
- Added `public.task_templates` for reusable operational task templates such as arrival photos, payment collection, review request, pressure washing prep, and dump trailer logistics.
- Added task template APIs and wired templates into the job workspace task command center.
- Added job-specific activity and profitability APIs.
- Added activity logging for job creation/update, task creation/update/completion/reordering/deletion, invoice updates/payment status changes, and file/photo uploads.
- Converted `/admin/jobs/[id]` into a tabbed operational hub: Overview, Tasks, Crew, Profit, Activity, and Notes.
- Added task search, status filtering, template insertion, and activity refresh after task mutations.
- Added job profitability cards and expense/category breakdowns sourced from relational job expense records.
- Updated dashboard activity to prefer relational operational activity records, falling back to synthesized activity only when no events exist yet.

### Remaining TODOs refined

- Add direct task-level upload binding from Storage files to task `completion_photo_urls` instead of URL paste.
- Add invoice due dates and automatic overdue status transitions.
- Add full e-signature capture for public estimates/scope changes.
- Add expense mutation logging outside CSV import once manual expense CRUD is expanded.
- Add gesture-level swipe actions after deciding whether to keep custom pointer handling or introduce a small gesture utility.

## 2026-05-21 consolidation pass

### Design/architecture audit outcome

The strongest existing PBPP pattern is the dark coastal admin shell with persistent desktop navigation, mobile bottom operations nav, and job-centered workflows. The weakest pattern was visual drift from iterative merges: raw black/zinc panels, inconsistent page widths, duplicated dashboard card treatments, and dashboard/job workspace surfaces using different button/input/card language.

### Consolidation changes

- Added shared admin presentation primitives in `app/globals.css`: `admin-bg`, `admin-shell-panel`, page width wrappers, cards, fields, pills, and primary/secondary actions.
- Consolidated the admin shell and mobile operations nav onto the same navy/aqua/cream coastal luxury palette.
- Reworked the dashboard styling into one calmer executive operations view focused on today's jobs, tasks, payments, crew, profit, alerts, and activity.
- Standardized key admin route width wrappers to `admin-page` / `admin-page-narrow` instead of one-off `max-w-*` directions.
- Brought `/admin/jobs/[id]` under the same admin card/action/input primitives while preserving the existing job workflow tabs and task/profit/activity functionality.
- Renamed prototype-ish dashboard language toward field workflow language where appropriate.

### Preserved workflows

- Existing auth/admin shell route structure.
- Existing jobs, tasks, invoices, expenses, crew, inventory, CMS, file upload, dashboard metrics, and activity workflows.
- Existing mobile bottom operations nav pattern.
- Existing Supabase schema and relational workflow work from earlier passes.

## 2026-05-21 invoice workflow pass

### Invoice reference implementation

The provided detailed service invoice was used as the primary workflow/design reference without copying it literally. The system now models the same professional service-business clarity dynamically: structured client/service metadata, itemized services, agreed adjustments, payments received, balance due, and scope explanation notes.

### Added invoice infrastructure

- Added relational `invoice_line_items`, `invoice_payments`, `invoice_scope_changes`, `invoice_templates`, and `invoice_audit_events` tables.
- Added invoice metadata columns for invoice number, service address, prepared by, issue/due dates, scope notes, client message, revision number, and soft delete timestamp.
- Added reusable invoice template API for saving/loading common service presets.
- Updated invoice create/edit APIs to maintain relational line items, payments, scope changes, audit events, automatic partial/paid status, revisions, and activity logging.
- Updated public invoice payloads to include payments, scope changes, payment totals, balances, and service metadata.

### UI consolidation

- Rebuilt admin invoice editing around service templates, line item clarity, agreed price adjustments, payment entries, and client transparency notes.
- Rebuilt public and print invoice views as branded responsive PBPP service documents with clear totals, payment tracking, balance status, and scope explanation.
- Preserved existing public invoice URLs and print/PDF browser workflow.

## Verification performed

- Baseline after merging platform foundation: `npm run type-check` passed.
- Baseline after merging platform foundation: `npm run build` passed.
- Final after first audit/fix pass: `npm run type-check` passed.
- Final after first audit/fix pass: `npm run build` passed.
- Final after first audit/fix pass: `npm run lint` passed (with the Next.js deprecation notice for `next lint`).
- Follow-up connected-systems pass: `npm run type-check` passed.
- Follow-up connected-systems pass: `npm run build` passed.
- Follow-up connected-systems pass: `npm run lint` passed (with the Next.js deprecation notice for `next lint`).
- Consolidation pass: `npm run type-check` passed.
- Consolidation pass: `npm run build` passed.
- Consolidation pass: `npm run lint` passed (with the Next.js deprecation notice for `next lint`).
- Consolidation pass: `git diff --check` passed.
- Invoice workflow pass: `npm run type-check` passed.
- Invoice workflow pass: `npm run build` passed.
- Invoice workflow pass: `npm run lint` passed (with the Next.js deprecation notice for `next lint`).
