# Updated Remaining Issues

*After task system integration (May 20, 2026)*

## Resolved

- ~~Job detail + photo upload UI~~ → `/admin/jobs/[id]` with categorized uploads, expenses, invoice from job
- ~~Invoice `job_id` wiring~~ → `createInvoiceFromJob` + `createInvoiceDraft({ job_id })`
- ~~Central task / operations checklist~~ → `/admin/tasks` hub, dashboard sections, cross-page quick-add, job task panel, optional checklists (`TASK_SYSTEM_REPORT.md`)

## High priority

1. **Admin auth users** — Create Supabase Auth operator accounts for production use.
2. **Public invoice RLS** — Consider tightening anon read to `public_id`-scoped access only.
3. **Signed URL expiry** — Job photo URLs expire (~7 days); add refresh on view if long-lived links needed.

## Medium priority

4. **Client / crew / supplies CRUD** — Still list-only outside job context.
5. **Quote / change order builder** — Placeholder on job detail; DB has `quotes` table.
6. **CMS visual editor** — JSON Site Studio only.
7. **Navigation + SEO admin UI** — Tables exist, no routes.
8. **Recurring expense scheduler** — Column exists, no cron.
9. **Crew payout calculator UI** — Display on job detail; no create form.
10. **Legacy photo arrays** — Migrate `before_photo_urls` / `after_photo_urls` into `job_photos` or edit-only in dashboard.
11. **Expense edit/delete** — Job detail can add expenses; no inline edit/remove yet.

## Low priority

12. **SOP checklist runner** — Partial: opt-in job checklist + workflow shortcuts on job/invoice/expense/website; no global SOP runner UI.
13. **npm audit** — Dependency advisories from prior install.
14. **Ops branch** — `internal-walkthrough-fe71` superseded by `/admin`.

## Production safety

- RLS remains enabled; no service role in browser.
- Marketing site under `app/(site)/` untouched except print CSS in global stylesheet.
