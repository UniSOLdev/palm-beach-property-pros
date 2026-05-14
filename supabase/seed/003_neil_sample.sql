-- Dev seed: Neil move-out quote (idempotent inserts)
-- Run after migrations 001 + 002 in Supabase SQL editor.

begin;

insert into clients (id, name, phone, email, address, client_type, referral_source, notes, follow_up_date, review_status, archived)
values (
  'b0000000-0000-4000-8000-000000000001',
  'Neil',
  '(561) 555-0142',
  'neil@example.com',
  '1240 Coastal Lane, Palm Beach Gardens, FL 33410',
  'Residential',
  'Neighbor referral',
  'Large home; confirm scope after movers finish.',
  (current_date + interval '3 day')::date,
  'Not sent',
  false
)
on conflict (id) do nothing;

insert into quotes (
  id,
  public_id,
  quote_number,
  client_id,
  job_address,
  service_type,
  notes,
  terms,
  expiration_date,
  status,
  deposit_required,
  deposit_amount,
  internal_notes,
  invoice_id,
  archived
) values (
  'b0000000-0000-4000-8000-000000000002',
  'pub_quote_neil_moveout',
  'PBPP-Q-1042',
  'b0000000-0000-4000-8000-000000000001',
  '1240 Coastal Lane, Palm Beach Gardens, FL 33410',
  'Move-out Cleaning',
  'Movers were delayed and home was not fully emptied during first walkthrough. Scope may expand once house is empty.',
  'Estimate valid 14 days. Final price may adjust after empty-home walkthrough. Deposits are non-refundable once materials block time is reserved.',
  (current_date + interval '14 day')::date,
  'Draft',
  true,
  250,
  'Confirm rug sizes on site. Patio is partial sun — algae light.',
  null,
  false
)
on conflict (id) do nothing;

-- Replace items if re-run
delete from quote_items where quote_id = 'b0000000-0000-4000-8000-000000000002';

insert into quote_items (id, quote_id, description, quantity, unit_price, is_addon, sort_order) values
  ('b0000000-0000-4000-8000-000000000101', 'b0000000-0000-4000-8000-000000000002', 'Full move-out cleaning (≈4,000 sq ft)', 1, 650, false, 0),
  ('b0000000-0000-4000-8000-000000000102', 'b0000000-0000-4000-8000-000000000002', 'Rug cleaning labor', 1, 125, false, 1),
  ('b0000000-0000-4000-8000-000000000103', 'b0000000-0000-4000-8000-000000000002', 'Rug Doctor rental — client reimburses rental fee (receipt on file)', 1, 0, false, 2),
  ('b0000000-0000-4000-8000-000000000104', 'b0000000-0000-4000-8000-000000000002', 'Trash removal — TBD pending final walk with empty home', 1, 0, false, 3),
  ('b0000000-0000-4000-8000-000000000105', 'b0000000-0000-4000-8000-000000000002', 'Patio pressure wash touch-up', 1, 100, false, 4),
  ('b0000000-0000-4000-8000-000000000201', 'b0000000-0000-4000-8000-000000000002', 'Interior window cleaning (full home)', 1, 185, true, 5),
  ('b0000000-0000-4000-8000-000000000202', 'b0000000-0000-4000-8000-000000000002', 'Appliance deep cleaning (in/out)', 1, 95, true, 6);

commit;
