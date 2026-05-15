-- PBPP expenses + import batches (Google Sheets / CSV pipeline)
-- Requires public.jobs for optional job_id FK.

create table if not exists public.expense_import_batches (
  id uuid primary key default gen_random_uuid(),
  label text,
  source text not null default 'csv',
  row_count integer not null default 0,
  inserted_count integer not null default 0,
  skipped_duplicates integer not null default 0,
  skipped_invalid integer not null default 0,
  reverted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.expense_import_batches (id) on delete set null,
  expense_date date not null,
  client_job_text text,
  job_id uuid references public.jobs (id) on delete set null,
  service_type text,
  vendor text,
  item_description text,
  category text,
  amount_cents integer not null,
  payment_method text,
  expense_type text,
  related_job_text text,
  reimbursable boolean not null default false,
  reimbursed boolean not null default false,
  notes text,
  dedupe_key text not null,
  import_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists expenses_dedupe_key_unique on public.expenses (dedupe_key);

create index if not exists expenses_expense_date_idx on public.expenses (expense_date desc);
create index if not exists expenses_category_idx on public.expenses (lower(category));
create index if not exists expenses_payment_idx on public.expenses (lower(payment_method));
create index if not exists expenses_batch_id_idx on public.expenses (batch_id);
create index if not exists expenses_job_id_idx on public.expenses (job_id);

alter table public.expense_import_batches enable row level security;
alter table public.expenses enable row level security;

-- Read-optimized aggregates for the operations dashboard (service role / server only).
create or replace view public.expense_totals_v as
select
  count(*)::bigint as expense_count,
  coalesce(sum(amount_cents), 0)::bigint as total_cents
from public.expenses;

select
  coalesce(nullif(trim(category), ''), 'Uncategorized') as category,
  sum(amount_cents)::bigint as total_cents,
  count(*)::bigint as expense_count
from public.expenses
group by 1;

create or replace view public.expense_analytics_by_payment as
select
  coalesce(nullif(trim(payment_method), ''), 'Unspecified') as payment_method,
  sum(amount_cents)::bigint as total_cents,
  count(*)::bigint as expense_count
from public.expenses
group by 1;

create or replace view public.expense_monthly_totals as
select
  (date_trunc('month', expense_date::timestamp))::date as month_start,
  sum(amount_cents)::bigint as total_cents,
  count(*)::bigint as expense_count
from public.expenses
group by 1
order by 1 desc;

create or replace view public.expense_job_totals as
select
  job_id,
  sum(amount_cents)::bigint as total_cents,
  count(*)::bigint as expense_count
from public.expenses
where job_id is not null
group by 1;
