# Changelog

## [Unreleased] — Receipt scanner (2026-05-21)

### Added

- Receipt **scan → preview → confirm → save** on `/admin/expenses` and `/admin/jobs/[id]`.
- Server-side extraction via OpenAI Vision (`OPENAI_API_KEY`).
- PBPP expense categories aligned across forms and scanner.
- Job expense save unified through `createExpense` (updates `job_expense_total`).

See `RECEIPT_SCANNER_REPORT.md`.

## [Unreleased] — Overnight stability (2026-05-21)

### Added

- Full **supplies inventory** admin: create, edit, archive, search, low-stock warnings, quantity +/- , job usage logging, bulk restock tasks.
- Migration `supplies_inventory_upgrade`: `is_reusable`, `expense_id`, `updated_at`, `supply_job_usage` table.
- Crew payout totals in **dashboard** and **jobs list** margin calculations.
- Site Studio banner: public homepage remains locked.
- FAB quick action: Supplies.
- Documentation: `OVERNIGHT_STABILITY_REPORT.md`, `BUG_REPORT.md`, `TEST_RESULTS.md`, `NEXT_STEPS.md`.

### Fixed

- `/admin/tasks` no longer fails when recurring task spawn errors.
- Job costing clarity on command center (labels, breakdown total row).

### Changed

- Mobile: admin inputs min 48px height, 16px font size (iOS keyboard).
- `app/admin/supplies` replaced read-only list with operational manager UI.

### Security note

- Documented RLS disabled on several CMS/task/media tables (see `BUG_REPORT.md` B-101).

### Unchanged

- Public marketing site (`app/(site)/**`, `components/marketing/**`, homepage lock).

## Prior releases

See git history for change orders, task system, job command center, homepage restore, and public homepage guardrails.
