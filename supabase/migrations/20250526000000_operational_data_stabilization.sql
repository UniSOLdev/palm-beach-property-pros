-- PBPP operational data stabilization: relational crew, mileage, receipts, inventory movement, RLS posture, and BI views.
-- This migration is additive and keeps existing JSON/legacy workflows intact.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add soft-delete / timestamp columns used by production admin workflows.
alter table public.clients add column if not exists soft_deleted_at timestamptz;
alter table public.jobs add column if not exists soft_deleted_at timestamptz;
alter table public.expenses add column if not exists updated_at timestamptz not null default now();
alter table public.expenses add column if not exists soft_deleted_at timestamptz;
alter table public.expenses add column if not exists receipt_file_id uuid references public.job_files (id) on delete set null;
alter table public.expenses add column if not exists mileage_log_id uuid;
alter table public.job_files add column if not exists expense_id uuid references public.expenses (id) on delete set null;
alter table public.job_files add column if not exists task_id uuid references public.operational_tasks (id) on delete set null;
alter table public.job_files add column if not exists category text;
alter table public.job_files add column if not exists is_marketing_ready boolean not null default false;
alter table public.job_files add column if not exists soft_deleted_at timestamptz;
alter table public.operational_tasks add column if not exists operational_notes text;
alter table public.operational_tasks add column if not exists before_file_id uuid references public.job_files (id) on delete set null;
alter table public.operational_tasks add column if not exists after_file_id uuid references public.job_files (id) on delete set null;
alter table public.operational_tasks add column if not exists soft_deleted_at timestamptz;
alter table public.inventory_items add column if not exists soft_deleted_at timestamptz;
alter table public.crew_members add column if not exists soft_deleted_at timestamptz;
alter table public.invoices add column if not exists job_id uuid references public.jobs (id) on delete set null;

create index if not exists expenses_receipt_file_idx on public.expenses (receipt_file_id) where receipt_file_id is not null;
create index if not exists expenses_job_date_idx on public.expenses (job_id, expense_date desc) where job_id is not null;
create index if not exists job_files_task_idx on public.job_files (task_id) where task_id is not null;
create index if not exists job_files_expense_idx on public.job_files (expense_id) where expense_id is not null;
create index if not exists invoices_job_id_idx on public.invoices (job_id) where job_id is not null;
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_issue_date_idx on public.invoices (issue_date desc);

-- Backfill direct invoice→job relationship from jobs.invoice_id when available.
update public.invoices inv
set job_id = jobs.id
from public.jobs jobs
where jobs.invoice_id = inv.id
  and inv.job_id is null;

-- Relational crew assignment table; jobs.crew_assignments JSON stays as compatibility/cache.
create table if not exists public.crew_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  task_id uuid references public.operational_tasks (id) on delete set null,
  crew_member_id uuid references public.crew_members (id) on delete set null,
  crew_name text not null,
  role text,
  assignment_status text not null default 'assigned',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  pay_type text,
  pay_rate_cents integer not null default 0,
  hours_estimated numeric(8, 2) not null default 0,
  hours_actual numeric(8, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  soft_deleted_at timestamptz,
  constraint crew_assignments_status_chk check (assignment_status in ('assigned', 'confirmed', 'in_progress', 'completed', 'cancelled'))
);

create index if not exists crew_assignments_job_idx on public.crew_assignments (job_id, assignment_status);
create index if not exists crew_assignments_member_idx on public.crew_assignments (crew_member_id, scheduled_start desc) where crew_member_id is not null;
create index if not exists crew_assignments_task_idx on public.crew_assignments (task_id) where task_id is not null;
alter table public.crew_assignments enable row level security;

-- Mileage and vehicle cost tracking.
create table if not exists public.mileage_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs (id) on delete set null,
  crew_member_id uuid references public.crew_members (id) on delete set null,
  expense_id uuid references public.expenses (id) on delete set null,
  vehicle_label text,
  log_date date not null default current_date,
  start_location text,
  end_location text,
  miles numeric(10, 2) not null default 0,
  rate_cents integer not null default 0,
  total_cents integer generated always as (round(miles * rate_cents)::integer) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  soft_deleted_at timestamptz,
  constraint mileage_logs_miles_chk check (miles >= 0),
  constraint mileage_logs_rate_chk check (rate_cents >= 0)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'expenses_mileage_log_fk'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_mileage_log_fk foreign key (mileage_log_id) references public.mileage_logs (id) on delete set null not valid;
  end if;
  alter table public.expenses validate constraint expenses_mileage_log_fk;
end $$;

create index if not exists mileage_logs_job_idx on public.mileage_logs (job_id, log_date desc) where job_id is not null;
create index if not exists mileage_logs_crew_idx on public.mileage_logs (crew_member_id, log_date desc) where crew_member_id is not null;
create index if not exists mileage_logs_date_idx on public.mileage_logs (log_date desc);
alter table public.mileage_logs enable row level security;

-- Inventory movements turn stock changes into structured operational data.
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  crew_member_id uuid references public.crew_members (id) on delete set null,
  movement_type text not null,
  quantity_delta numeric(12, 2) not null,
  unit_cost_cents integer,
  notes text,
  created_by text not null default 'PBPP Ops',
  created_at timestamptz not null default now(),
  constraint inventory_movements_type_chk check (movement_type in ('restock', 'use', 'assign', 'return', 'adjust', 'damage', 'dispose'))
);

create index if not exists inventory_movements_item_idx on public.inventory_movements (inventory_item_id, created_at desc);
create index if not exists inventory_movements_job_idx on public.inventory_movements (job_id, created_at desc) where job_id is not null;
alter table public.inventory_movements enable row level security;


-- Refresh earlier expense analytics so soft-deleted records do not leak into rollups.
create or replace view public.expense_totals_v as
select
  count(*)::integer as expense_count,
  coalesce(sum(amount_cents), 0)::integer as total_cents
from public.expenses
where soft_deleted_at is null;

create or replace view public.expense_analytics_by_payment as
select
  coalesce(payment_method, 'unknown') as payment_method,
  count(*)::integer as expense_count,
  coalesce(sum(amount_cents), 0)::integer as total_cents
from public.expenses
where soft_deleted_at is null
group by 1
order by total_cents desc;

create or replace view public.expense_monthly_totals as
select
  date_trunc('month', expense_date::timestamptz)::date as month_start,
  count(*)::integer as expense_count,
  coalesce(sum(amount_cents), 0)::integer as total_cents
from public.expenses
where soft_deleted_at is null
group by 1
order by 1 desc;

create or replace view public.expense_job_totals as
select
  job_id,
  count(*)::integer as expense_count,
  coalesce(sum(amount_cents), 0)::integer as total_cents
from public.expenses
where job_id is not null
  and soft_deleted_at is null
group by job_id;

-- Receipt uploads are a focused projection over job_files + expenses without duplicating storage.
create or replace view public.receipt_uploads_v as
select
  jf.id as file_id,
  jf.job_id,
  jf.expense_id,
  e.vendor,
  e.category,
  e.amount_cents,
  jf.file_name,
  jf.file_type,
  jf.mime_type,
  jf.storage_path,
  jf.caption,
  jf.created_at
from public.job_files jf
left join public.expenses e on e.id = jf.expense_id
where jf.soft_deleted_at is null
  and (jf.file_type = 'receipt' or jf.category = 'receipt' or jf.expense_id is not null);

-- Estimates: quotes are PBPP's estimate records; expose a stable operational naming layer.
create or replace view public.estimates_v as
select
  q.id,
  q.client_id,
  q.service_type,
  q.property_address,
  q.notes,
  q.customer_notes,
  q.terms,
  q.internal_notes,
  q.line_items,
  q.subtotal_cents,
  q.tax_cents,
  q.discount_cents,
  q.deposit_cents,
  q.total_cents,
  q.status,
  q.reference_code,
  q.row_version,
  q.created_at,
  q.updated_at,
  inv.id as converted_invoice_id,
  inv.public_token as converted_invoice_token
from public.quotes q
left join public.invoices inv on inv.quote_id = q.id;

-- Operational analytics views.
create or replace view public.invoice_payment_totals_v as
select
  inv.id as invoice_id,
  coalesce(sum(pay.amount_cents), 0)::integer as paid_cents,
  greatest(inv.total_cents - coalesce(sum(pay.amount_cents), 0), 0)::integer as balance_cents,
  count(pay.id)::integer as payment_count,
  max(pay.payment_date) as last_payment_date
from public.invoices inv
left join public.invoice_payments pay on pay.invoice_id = inv.id
where inv.soft_deleted_at is null
group by inv.id, inv.total_cents;

create or replace view public.unpaid_invoices_v as
select
  inv.id,
  inv.client_id,
  inv.job_id,
  inv.invoice_number,
  inv.title,
  inv.status,
  inv.issue_date,
  inv.due_date,
  inv.total_cents,
  totals.paid_cents,
  totals.balance_cents,
  c.full_name as client_name
from public.invoices inv
join public.invoice_payment_totals_v totals on totals.invoice_id = inv.id
left join public.clients c on c.id = inv.client_id
where inv.soft_deleted_at is null
  and inv.status not in ('void', 'cancelled', 'canceled')
  and totals.balance_cents > 0;

create or replace view public.revenue_by_month_v as
select
  date_trunc('month', coalesce(inv.issue_date::timestamptz, inv.created_at))::date as month_start,
  count(inv.id)::integer as invoice_count,
  sum(inv.total_cents)::integer as invoice_total_cents,
  coalesce(sum(totals.paid_cents), 0)::integer as paid_cents,
  coalesce(sum(totals.balance_cents), 0)::integer as balance_cents
from public.invoices inv
left join public.invoice_payment_totals_v totals on totals.invoice_id = inv.id
where inv.soft_deleted_at is null
  and inv.status not in ('void', 'cancelled', 'canceled')
group by 1
order by 1 desc;

create or replace view public.expense_categories_v as
select
  coalesce(category, 'Uncategorized') as category,
  count(*)::integer as expense_count,
  sum(amount_cents)::integer as total_cents,
  avg(amount_cents)::integer as average_cents
from public.expenses
where soft_deleted_at is null
group by 1
order by total_cents desc;

create or replace view public.job_profitability_v as
select
  j.id as job_id,
  j.job_number,
  j.title,
  j.client_id,
  c.full_name as client_name,
  j.status,
  coalesce(inv.total_cents, j.revenue_cents, 0)::integer as revenue_cents,
  coalesce(exp.total_cents, 0)::integer as expense_cents,
  coalesce(miles.total_cents, 0)::integer as mileage_cents,
  coalesce(labor.labor_cents, 0)::integer as labor_cents,
  (coalesce(inv.total_cents, j.revenue_cents, 0) - coalesce(exp.total_cents, 0) - coalesce(miles.total_cents, 0) - coalesce(labor.labor_cents, 0))::integer as net_profit_cents,
  case
    when coalesce(inv.total_cents, j.revenue_cents, 0) > 0 then
      round(((coalesce(inv.total_cents, j.revenue_cents, 0) - coalesce(exp.total_cents, 0) - coalesce(miles.total_cents, 0) - coalesce(labor.labor_cents, 0))::numeric / coalesce(inv.total_cents, j.revenue_cents, 0)::numeric) * 100, 1)
    else 0
  end as margin_percent,
  j.updated_at
from public.jobs j
left join public.clients c on c.id = j.client_id
left join public.invoices inv on inv.id = coalesce(j.invoice_id, (select i2.id from public.invoices i2 where i2.job_id = j.id order by i2.created_at desc limit 1))
left join (
  select job_id, sum(amount_cents)::integer as total_cents
  from public.expenses
  where job_id is not null and soft_deleted_at is null
  group by job_id
) exp on exp.job_id = j.id
left join (
  select job_id, sum(total_cents)::integer as total_cents
  from public.mileage_logs
  where job_id is not null and soft_deleted_at is null
  group by job_id
) miles on miles.job_id = j.id
left join (
  select job_id, sum(
    case
      when pay_type = 'hourly' then round(hours_actual * pay_rate_cents)::integer
      when pay_type = 'flat' then pay_rate_cents
      else 0
    end
  )::integer as labor_cents
  from public.crew_assignments
  where soft_deleted_at is null
  group by job_id
) labor on labor.job_id = j.id
where j.soft_deleted_at is null;

create or replace view public.crew_utilization_v as
select
  cm.id as crew_member_id,
  cm.full_name,
  cm.role,
  cm.status,
  count(ca.id)::integer as assignment_count,
  count(ca.id) filter (where ca.assignment_status in ('assigned', 'confirmed', 'in_progress'))::integer as active_assignment_count,
  coalesce(sum(ca.hours_estimated), 0)::numeric(10,2) as hours_estimated,
  coalesce(sum(ca.hours_actual), 0)::numeric(10,2) as hours_actual,
  coalesce(sum(case when ca.pay_type = 'hourly' then round(ca.hours_actual * ca.pay_rate_cents)::integer when ca.pay_type = 'flat' then ca.pay_rate_cents else 0 end), 0)::integer as labor_cost_cents
from public.crew_members cm
left join public.crew_assignments ca on ca.crew_member_id = cm.id and ca.soft_deleted_at is null
where cm.soft_deleted_at is null
group by cm.id, cm.full_name, cm.role, cm.status;

create or replace view public.mileage_totals_v as
select
  date_trunc('month', log_date::timestamptz)::date as month_start,
  job_id,
  crew_member_id,
  count(id)::integer as trip_count,
  coalesce(sum(miles), 0)::numeric(12,2) as miles,
  coalesce(sum(total_cents), 0)::integer as total_cents
from public.mileage_logs
where soft_deleted_at is null
group by 1, job_id, crew_member_id;

create or replace view public.inventory_alerts_v as
select
  id,
  name,
  category,
  inventory_type,
  operational_status,
  quantity,
  reorder_level,
  storage_location,
  assigned_crew,
  assigned_job_id,
  priority_level,
  case
    when quantity <= 0 then 'out_of_stock'
    when reorder_level > 0 and quantity <= reorder_level then 'low_stock'
    when operational_status not in ('available', 'in_stock', 'ready') then 'attention'
    else 'ok'
  end as alert_status
from public.inventory_items
where soft_deleted_at is null
  and (
    quantity <= 0
    or (reorder_level > 0 and quantity <= reorder_level)
    or operational_status not in ('available', 'in_stock', 'ready')
  );

create or replace view public.operational_kpis_v as
select
  (select count(*) from public.jobs where soft_deleted_at is null and status not in ('completed', 'cancelled', 'archived'))::integer as active_jobs,
  (select count(*) from public.operational_tasks where soft_deleted_at is null and status not in ('done', 'cancelled'))::integer as open_tasks,
  (select count(*) from public.operational_tasks where soft_deleted_at is null and status = 'blocked')::integer as blocked_tasks,
  (select count(*) from public.unpaid_invoices_v)::integer as unpaid_invoice_count,
  (select coalesce(sum(balance_cents), 0) from public.unpaid_invoices_v)::integer as unpaid_balance_cents,
  (select coalesce(sum(invoice_total_cents), 0) from public.revenue_by_month_v where month_start = date_trunc('month', now())::date)::integer as month_revenue_cents,
  (select coalesce(sum(net_profit_cents), 0) from public.job_profitability_v)::integer as all_time_net_profit_cents,
  (select count(*) from public.inventory_alerts_v)::integer as inventory_alert_count,
  now() as generated_at;

-- Updated-at triggers for operational tables.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'clients','jobs','invoices','expenses','job_files','operational_tasks','inventory_items','crew_members',
    'crew_assignments','mileage_logs','invoice_line_items','invoice_payments','invoice_templates'
  ] loop
    if to_regclass('public.' || tbl) is not null then
      execute format('drop trigger if exists set_%I_updated_at on public.%I', tbl, tbl);
      execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', tbl, tbl);
    end if;
  end loop;
end $$;

-- RLS posture: server-side admin API uses service_role; explicit service_role policies document/permit backend access.
do $$
declare
  tbl text;
  pol text;
begin
  foreach tbl in array array[
    'clients','jobs','invoices','quotes','expense_import_batches','expenses','inventory_items','crew_members','job_files',
    'operational_tasks','operational_activity','task_templates','invoice_line_items','invoice_payments','invoice_scope_changes',
    'invoice_templates','invoice_audit_events','crew_assignments','mileage_logs','inventory_movements'
  ] loop
    if to_regclass('public.' || tbl) is not null then
      pol := 'service_role_all_' || tbl;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = pol) then
        execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', pol, tbl);
      end if;
    end if;
  end loop;
end $$;
