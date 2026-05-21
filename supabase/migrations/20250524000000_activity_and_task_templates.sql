-- Relational activity feed and reusable field task templates.

create table if not exists public.operational_activity (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  title text not null,
  body text,
  actor_name text not null default 'PBPP Ops',
  job_id uuid references public.jobs (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  task_id uuid references public.operational_tasks (id) on delete set null,
  invoice_id uuid references public.invoices (id) on delete set null,
  expense_id uuid references public.expenses (id) on delete set null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists operational_activity_created_idx on public.operational_activity (created_at desc);
create index if not exists operational_activity_job_idx on public.operational_activity (job_id, created_at desc) where job_id is not null;
create index if not exists operational_activity_client_idx on public.operational_activity (client_id, created_at desc) where client_id is not null;
create index if not exists operational_activity_event_type_idx on public.operational_activity (event_type, created_at desc);

alter table public.operational_activity enable row level security;

create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text,
  title text not null,
  priority text not null default 'normal',
  recurring_rule text,
  operational_notes text,
  attachment_prompt text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_templates_priority_chk check (priority in ('urgent', 'high', 'normal', 'low'))
);

create index if not exists task_templates_service_idx on public.task_templates (lower(service_type), sort_order) where service_type is not null;
create index if not exists task_templates_active_idx on public.task_templates (is_active, sort_order);

alter table public.task_templates enable row level security;

insert into public.task_templates (name, service_type, title, priority, recurring_rule, operational_notes, attachment_prompt, sort_order)
values
  ('Arrival photos', null, 'Upload before photos', 'high', null, 'Capture driveway, facade, access points, and any pre-existing conditions before work starts.', 'Before photos', 10),
  ('Payment collection', null, 'Collect payment or confirm invoice status', 'urgent', null, 'Confirm payment method before leaving the property.', 'Payment confirmation', 20),
  ('Review request', null, 'Send review request', 'normal', null, 'Send only after final walkthrough and client approval.', null, 30),
  ('Pressure washing prep', 'Pressure Washing', 'Pressure wash driveway', 'high', null, 'Protect landscaping, confirm surface condition, and photograph any cracks before washing.', 'Before/after driveway photos', 40),
  ('Trailer logistics', null, 'Pickup dump trailer', 'normal', null, 'Confirm hitch, route, dump fee, and disposal receipt.', 'Dump receipt', 50)
on conflict do nothing;
