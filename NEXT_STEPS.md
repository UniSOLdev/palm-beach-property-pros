# Next Steps — PBPP Admin

## Immediate (before heavy field use)

1. **RLS hardening** — Enable RLS on `tasks`, `cms_sections`, `cms_navigation`, `cms_seo`, `media_folders`, `media_assets` with authenticated `admin_all` policies (test anon cannot read/write).
2. **iPhone manual QA** — Run checklist in `TEST_RESULTS.md` on device.
3. **Supabase Auth** — Ensure production operator accounts exist.
4. **`OPENAI_API_KEY`** — Set in Vercel for receipt scanner extraction (`RECEIPT_SCANNER_REPORT.md`).

## Short term (1–2 sprints)

5. **Client / crew CRUD forms** — Minimal add/edit in admin (still list-only).
6. **Expense edit/delete** — On job detail and expenses page.
7. **Invoice payment status** — Toggle Paid/Unpaid on `/admin/invoices/[id]`.
8. **Expense ↔ supply link** — UI to pick `expense_id` when restocking from receipt.
9. **Reconcile `job_expense_total`** — On expense delete/archive, decrement job column.
10. **Receipt scanner** — Batch upload, longer-lived receipt URLs, on-device OCR fallback if API unavailable.

## Change orders / quotes

- **Change orders** — Implemented (`/admin/change-orders`, `/co/[publicId]`). See `CHANGE_ORDER_REPORT.md`.
- **Legacy quotes table** — Still in DB; no new quote builder unless product asks. Prefer change orders for scope creep.

## Operational intelligence (future — not tonight)

- Background cron for recurring expenses (column exists).
- Email/SMS reminders for overdue invoices (no automation added).
- Dashboard “low stock supplies” widget.
- Weekly margin rollup email.

## Website / CMS

- Gated **publish** workflow: preview CMS → approve → update public routes (homepage stays locked until explicit decision).
- Do **not** reconnect Site Studio to `/` without publish gate.

## Architecture

- Avoid large refactors; extend existing server actions + admin-card patterns.
- Keep middleware scoped to `/admin/*` only.
