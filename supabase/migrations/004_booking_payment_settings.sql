-- Booking / payment URLs and copy for marketing + admin quick actions.
-- No secrets: public links and display-only payment instructions only.

alter table business_settings add column if not exists square_booking_url text;
alter table business_settings add column if not exists square_invoice_url text;
alter table business_settings add column if not exists zelle_display_name text;
alter table business_settings add column if not exists zelle_email text;
alter table business_settings add column if not exists zelle_phone text;
alter table business_settings add column if not exists deposit_instructions text;
alter table business_settings add column if not exists cancellation_policy text;
alter table business_settings add column if not exists booking_cta_text text;
alter table business_settings add column if not exists payment_cta_text text;
alter table business_settings add column if not exists preferred_booking_method text default 'Quote Form';
alter table business_settings add column if not exists booking_payment_methods text[] default array['Cash','Zelle','Card','Check','Square Invoice']::text[];

alter table quotes add column if not exists deposit_received boolean not null default false;
alter table quotes add column if not exists deposit_received_at timestamptz;
