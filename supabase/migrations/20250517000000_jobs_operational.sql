-- Operational job fields (ALTER only — preserves existing job rows)
-- Requires quotes + invoices from 20250516000000_quotes_conversion.sql

alter table public.jobs
  add column if not exists updated_at timestamptz not null default now();

alter table public.jobs
  add column if not exists row_version integer not null default 1;

alter table public.jobs
  add column if not exists job_number text;

create unique index if not exists jobs_job_number_unique on public.jobs (job_number)
  where job_number is not null;

alter table public.jobs
  add column if not exists service_type text;

alter table public.jobs
  add column if not exists property_address text;

alter table public.jobs
  add column if not exists revenue_cents integer not null default 0;

alter table public.jobs
  add column if not exists payment_method text;

alter table public.jobs
  add column if not exists quote_id uuid references public.quotes (id) on delete set null;

alter table public.jobs
  add column if not exists invoice_id uuid references public.invoices (id) on delete set null;

alter table public.jobs
  add column if not exists crew_assignments jsonb not null default '[]'::jsonb;

alter table public.jobs
  add column if not exists notes text;

alter table public.jobs
  add column if not exists internal_notes text;

alter table public.jobs
  add column if not exists referral_source text;

alter table public.jobs
  add column if not exists review_requested boolean not null default false;

create index if not exists jobs_quote_id_idx on public.jobs (quote_id);
create index if not exists jobs_invoice_id_idx on public.jobs (invoice_id);
create index if not exists jobs_updated_at_idx on public.jobs (updated_at desc);
