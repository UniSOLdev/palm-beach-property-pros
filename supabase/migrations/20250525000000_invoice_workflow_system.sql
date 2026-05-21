-- Premium service invoice workflow: templates, relational line items, scope changes, payments, and audit history.

alter table public.invoices
  add column if not exists invoice_number text;

create unique index if not exists invoices_invoice_number_unique on public.invoices (invoice_number)
  where invoice_number is not null;

alter table public.invoices
  add column if not exists service_address text;

alter table public.invoices
  add column if not exists prepared_by text not null default 'Palm Beach Property Pros';

alter table public.invoices
  add column if not exists issue_date date not null default current_date;

alter table public.invoices
  add column if not exists due_date date;

alter table public.invoices
  add column if not exists scope_notes text;

alter table public.invoices
  add column if not exists client_message text;

alter table public.invoices
  add column if not exists revision_number integer not null default 1;

alter table public.invoices
  add column if not exists soft_deleted_at timestamptz;

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_cents integer not null default 0,
  sort_order integer not null default 0,
  service_template_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoice_line_items_invoice_idx on public.invoice_line_items (invoice_id, sort_order);
alter table public.invoice_line_items enable row level security;

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  payment_date date not null default current_date,
  method text not null default 'cash',
  description text,
  amount_cents integer not null,
  reference text,
  received_by text not null default 'PBPP Ops',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_payments_method_chk check (method in ('cash', 'zelle', 'card', 'check', 'venmo', 'other')),
  constraint invoice_payments_amount_chk check (amount_cents >= 0)
);

create index if not exists invoice_payments_invoice_idx on public.invoice_payments (invoice_id, payment_date desc);
alter table public.invoice_payments enable row level security;

create table if not exists public.invoice_scope_changes (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  change_type text not null default 'adjustment',
  title text not null,
  description text,
  amount_cents integer not null default 0,
  before_total_cents integer,
  after_total_cents integer,
  acknowledged_at timestamptz,
  acknowledged_by text,
  created_by text not null default 'PBPP Ops',
  created_at timestamptz not null default now(),
  constraint invoice_scope_changes_type_chk check (change_type in ('addition', 'removal', 'adjustment', 'note'))
);

create index if not exists invoice_scope_changes_invoice_idx on public.invoice_scope_changes (invoice_id, created_at desc);
alter table public.invoice_scope_changes enable row level security;

create table if not exists public.invoice_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text,
  description text,
  line_items jsonb not null default '[]'::jsonb,
  scope_notes text,
  default_terms text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoice_templates_active_idx on public.invoice_templates (is_active, lower(name));
create index if not exists invoice_templates_service_idx on public.invoice_templates (lower(service_type)) where service_type is not null;
alter table public.invoice_templates enable row level security;

create table if not exists public.invoice_audit_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  event_type text not null,
  actor_name text not null default 'PBPP Ops',
  summary text not null,
  before_snapshot jsonb,
  after_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists invoice_audit_events_invoice_idx on public.invoice_audit_events (invoice_id, created_at desc);
alter table public.invoice_audit_events enable row level security;

insert into public.invoice_templates (name, service_type, description, line_items, scope_notes)
values
  (
    'Property cleanup invoice',
    'Property Maintenance',
    'Structured cleanup invoice with debris, labor, and disposal clarity.',
    '[{"description":"Moving / Weed Whacking / Leaf Blowing","quantity":1,"unit_cents":65000},{"description":"Tree Trimming / Palm Trimming","quantity":1,"unit_cents":25000},{"description":"Debris Removal - Load #1","quantity":1,"unit_cents":25000},{"description":"Truck Rental / Fuel","quantity":1,"unit_cents":15000},{"description":"Disposal Fee","quantity":1,"unit_cents":15000}]'::jsonb,
    'Explain original scope, approved additions, debris volume, access needs, and final agreed amount in plain language.'
  ),
  (
    'Pressure washing invoice',
    'Pressure Washing',
    'Driveway/patio pressure washing with before-after documentation.',
    '[{"description":"Pressure Wash Driveway","quantity":1,"unit_cents":35000},{"description":"Pretreatment / Surface Prep","quantity":1,"unit_cents":7500},{"description":"Before / After Photo Documentation","quantity":1,"unit_cents":0}]'::jsonb,
    'Document surface condition, pretreatment, protected areas, and completed result.'
  )
on conflict do nothing;
