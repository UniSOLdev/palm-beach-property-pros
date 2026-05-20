# Updated Remaining Issues

*After homepage restoration + production audit (May 20, 2026)*

## Resolved

- ~~Job detail + photo upload UI~~ → `/admin/jobs/[id]` with categorized uploads, expenses, invoice from job
- ~~Invoice `job_id` wiring~~ → `createInvoiceFromJob` + `createInvoiceDraft({ job_id })`
- ~~Central task / operations checklist~~ → `/admin/tasks` hub, dashboard sections, cross-page quick-add, job task panel, optional checklists (`TASK_SYSTEM_REPORT.md`)
- ~~Crew page wrong table~~ → `/admin/crew` uses `crew_members`
- ~~Login wrapped in ops shell~~ → login uses minimal layout
- ~~FAB dead query links~~ → tasks/expenses focus handlers
- ~~Silent form failures~~ → inline errors on key admin forms
- ~~Preview homepage mismatch vs production~~ → `PremiumHomePage` + dark header restored (`PUBLIC_ADMIN_SEPARATION_AUDIT.md`)
- ~~Quote / change order builder placeholder~~ → Change orders + `/co/[publicId]` approval (`CHANGE_ORDER_REPORT.md`)
- ~~Supplies read-only list~~ → Inventory CRUD, low-stock, job usage (`OVERNIGHT_STABILITY_REPORT.md`)
- ~~Tasks page crash on recurring spawn~~ → Non-blocking try/catch
- ~~Dashboard/jobs margin missing crew payouts~~ → `getCrewPayoutTotalsByJob`
- ~~Receipt scan / auto-import~~ → Preview-confirm scanner (`RECEIPT_SCANNER_REPORT.md`); requires `OPENAI_API_KEY`

## High priority

1. **RLS on tasks/CMS/media** — Remote DB has RLS disabled on 6 tables (Supabase advisor); add policies before production (`BUG_REPORT.md` B-101).
2. **Admin auth users** — Create Supabase Auth operator accounts for production use.
3. **Public invoice RLS** — Consider tightening anon read to `public_id`-scoped access only.
4. **Signed URL expiry** — Job photo URLs expire (~7 days); add refresh on view if long-lived links needed.

## Medium priority

4. **Client / crew / supplies CRUD** — Crew list fixed; still no in-app create/edit forms.
5. **CMS visual editor** — JSON Site Studio only; public homepage is locked to `PremiumHomePage` until gated CMS publish exists.
6. **Navigation + SEO admin UI** — Tables exist, no routes.
7. **Recurring expense scheduler** — Column exists, no cron.
8. **Crew payout calculator UI** — Display on job detail; no create form.
9. **Legacy photo arrays** — Migrate `before_photo_urls` / `after_photo_urls` into `job_photos` or edit-only in dashboard.
10. **Expense edit/delete** — Job detail can add expenses; no inline edit/remove yet.

## Low priority

12. **SOP checklist runner** — Partial: opt-in job checklist + workflow shortcuts on job/invoice/expense/website; no global SOP runner UI.
13. **npm audit** — Dependency advisories from prior install.
14. **Ops branch** — `internal-walkthrough-fe71` superseded by `/admin`.

## Public homepage regression (mitigated)

- **What happened:** Admin/CMS integration (`getHomeCmsSections()` in `app/(site)/page.tsx`) replaced the live premium homepage with a light “Done Right” CMS-driven layout on preview deploys.
- **Current mitigation:** Public `/` renders the locked `PremiumHomePage` component only—no runtime CMS reads on the homepage.
- **Guardrails:** `PUBLIC_SITE_PROTECTION.md`, `npm run verify:public-homepage`, pre-deploy checks in `DEPLOYMENT_CHECKLIST.md`.
- **Future improvement:** Gated **publish-to-site** flow from Site Studio so CMS edits can update the marketing site only after explicit operator approval.

## Production safety

- RLS remains enabled; no service role in browser.
- Marketing homepage is locked; other `app/(site)/` pages unchanged unless explicitly requested.
