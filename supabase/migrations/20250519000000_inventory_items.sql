-- PBPP operational inventory (depot / field ops). Non-destructive: new table only.

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'General',
  inventory_type text not null default 'consumable',
  operational_status text not null default 'ready',
  quantity numeric(12, 2) not null default 0 check (quantity >= 0),
  unit text not null default 'each',
  storage_location text,
  reorder_level numeric(12, 2) not null default 0 check (reorder_level >= 0),
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  vendor text,
  notes text,
  assigned_crew text,
  assigned_job_id uuid references public.jobs (id) on delete set null,
  last_restocked date,
  condition text,
  is_consumable boolean not null default true,
  priority_level text not null default 'normal',
  priority_rank smallint not null default 2,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_category_idx on public.inventory_items (lower(category));
create index if not exists inventory_items_type_idx on public.inventory_items (inventory_type);
create index if not exists inventory_items_status_idx on public.inventory_items (operational_status);
create index if not exists inventory_items_storage_idx on public.inventory_items (lower(storage_location));
create index if not exists inventory_items_job_idx on public.inventory_items (assigned_job_id);

alter table public.inventory_items enable row level security;
