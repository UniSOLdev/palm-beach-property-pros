# Task System Report

*Palm Beach Property Pros — operations checklist integration (May 20, 2026)*

## Summary

`/admin/tasks` is the central operations command center. Tasks are stored in the existing `tasks` table (no duplicate table). CRUD, drag-sort, recurring spawn, and Today/Urgent/Overdue/Week/Completed views are preserved and extended with categories, entity links, dashboard hub, and contextual quick-add across admin.

## Schema (`tasks`)

| Column | Purpose |
|--------|---------|
| `title`, `description` | Task name and notes |
| `status` | `todo`, `in_progress`, `done`, `cancelled` (legacy `open`/`completed` normalized in UI) |
| `priority` | `low`, `medium`, `high`, `urgent` |
| `due_date`, `completed_at` | Scheduling and completion |
| `category` | PBPP category (Job Follow-Up, Invoice Follow-Up, etc.) |
| `job_id`, `client_id`, `invoice_id`, `expense_id` | Cross-entity links |
| `assigned_crew_member_id`, `assigned_crew_ids` | Crew assignment |
| `recurring_rule`, `recurring_parent_id` | Recurring tasks (unchanged behavior) |
| `sort_order` | Drag-sort ordering |
| `archived` | Soft delete / archive |
| `created_by`, `created_at`, `updated_at` | Audit fields |

**Migration:** `tasks_operational_fields` — adds link/category/crew columns; migrates legacy status/priority values; non-destructive; RLS unchanged (`authenticated` admin policies).

## Categories

Job Follow-Up, Quote Follow-Up, Invoice Follow-Up, Client Communication, Expense/Receipt, Website Update, Photo Upload, Supply Restock, Crew/Admin, Marketing, LLC/Business Setup, General.

## Key files

| Path | Role |
|------|------|
| `lib/admin/task-constants.ts` | Categories, views, job checklist, workflow shortcuts |
| `lib/admin/task-utils.ts` | Filters, overdue, legacy normalization |
| `lib/admin/actions/tasks.ts` | Server CRUD, bulk, checklist, reorder |
| `components/admin/tasks-board.tsx` | Main task board |
| `components/admin/task-form-modal.tsx` | Create/edit modal |
| `components/admin/task-quick-add.tsx` | Reusable quick-add button |
| `components/admin/task-job-panel.tsx` | Job command center panel |
| `components/admin/task-workflow-bar.tsx` | Optional shortcut buttons |
| `components/admin/dashboard-tasks.tsx` | Dashboard task hub |

## Integrations

| Route | Integration |
|-------|-------------|
| `/admin` | Today, urgent, overdue, week, completed sections + quick add |
| `/admin/tasks` | Full board (unchanged entry point) |
| `/admin/jobs` | Page + per-job quick-add |
| `/admin/jobs/[id]` | Task panel, checklist button, workflow shortcuts |
| `/admin/jobs/[id]/edit` | Quick-add with job pre-linked |
| `/admin/invoices` | Page + per-invoice quick-add |
| `/admin/invoices/[id]` | Invoice task actions + unpaid shortcuts |
| `/admin/clients` | Page + per-client quick-add |
| `/admin/expenses` | Page shortcuts + per-expense quick-add |
| `/admin/website` | Website update tasks + gallery shortcut |

## Job checklist (opt-in)

Click **Create job checklist** on a job to add 8 standard tasks (scope, photos, expenses, invoice, payment, review, website). No auto-spam on job create.

## Mobile

- 44–48px touch targets on actions
- Bottom-sheet task modal
- ↑/↓ move fallback alongside drag-sort
- `pb-24` on long forms (edit job) for bottom nav clearance

## Auth / RLS

- Browser uses anon/publishable key + SSR session only
- `tasks` RLS: authenticated admin access (existing policies)
- No `service_role` in client bundles

## Verification

```bash
npm run type-check   # pass
npm run build        # pass (includes lint)
```

Manual smoke: create/edit/complete/archive task; filter views; quick-add from job and invoice; dashboard cards; marketing routes still static/SSG.
