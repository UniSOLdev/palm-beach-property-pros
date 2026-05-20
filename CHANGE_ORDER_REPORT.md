# Change Order + Scope Approval — Implementation Report

## Summary

Palm Beach Property Pros now has a full **change order** workflow: create scope changes from a job, send a client approval link, collect typed e-signature acceptance, and retain approval records before extra work proceeds.

## Database

Migration: `supabase/migrations/20260520120000_change_orders.sql` (applied remotely as `change_orders_scope_approval`)

- **`change_orders`** — draft / sent / approved / declined / void, totals, client contact, approval metadata, `approval_snapshot_json`, optional `invoice_id`
- **`change_order_items`** — line items with quantity, unit price, line total, sort order
- **`tasks.change_order_id`** — optional link for future task association
- **RLS** — authenticated full access; anon read only for sent/approved/declined (non-archived)
- **`submit_change_order_approval` RPC** — SECURITY DEFINER; prevents overwriting an already-approved record

## Admin routes

| Route | Purpose |
|-------|---------|
| `/admin/change-orders` | List all change orders |
| `/admin/change-orders/new` | Create (supports `?jobId=` prefill) |
| `/admin/change-orders/[id]` | Detail, copy link, void, add to invoice |
| `/admin/change-orders/[id]/edit` | Edit draft only |

**Job command center** (`/admin/jobs/[id]`):

- Change Orders panel with status badges
- Create change order, copy approval link, add approved CO to invoice
- Sticky action bar: **Change order** (replaces disabled Quote button)

Nav: **More → Change Orders**

## Public approval

- **`/co/[publicId]`** — no login; PBPP branding; scope reason, lines, total
- Typed full name as signature; approve or decline
- Confirmation states; duplicate approve does not overwrite (RPC + UI)

Approval language (v1.0):

> I understand and approve the additional scope of work, pricing, and terms listed above. I authorize Palm Beach Property Pros to proceed with this change order.

Snapshot stored in `approval_snapshot_json` when marked **sent**.

## Invoice integration

- **Add to invoice** — appends line items prefixed with `[CO-####]` to the job’s linked invoice
- Sets `change_orders.invoice_id`; button hidden if already linked
- Requires job `invoice_id` (create invoice first)

## Tasks

Workflow shortcuts on job change-order panel:

- Send change order approval link
- Follow up on unsigned change order
- Add approved change order to invoice

`CreateTaskInput` / bulk tasks support `change_order_id` for future linking.

## Public site protection

- No changes to `app/(site)/**`, `components/marketing/**`, or homepage
- Public route is `app/co/**` only
- Run `npm run verify:public-homepage` before deploy

## QA commands

```bash
npm run verify:public-homepage
npm run type-check
npm run build
```

## Manual test checklist

- [ ] Create change order from job with line items
- [ ] Save draft; edit draft
- [ ] Mark sent; copy `/co/{publicId}` link
- [ ] Approve on phone with typed name
- [ ] Admin shows approved + signature + timestamp
- [ ] Add approved CO to invoice (no double-add)
- [ ] Decline path records status
- [ ] Homepage still premium locked
- [ ] `/admin/jobs/[id]` and `/admin/tasks` unchanged behavior
