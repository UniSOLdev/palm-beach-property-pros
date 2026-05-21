-- PBPP crew roster (field workforce). Non-destructive: new table only.

create table if not exists public.crew_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null default 'cleaning_tech',
  status text not null default 'available',
  skill_level text not null default 'intermediate',
  phone text,
  email text,
  notes text,
  certifications text,
  availability_notes text,
  default_pay_type text not null default 'percentage',
  default_pay_rate_cents integer not null default 0 check (default_pay_rate_cents >= 0),
  default_pay_percent numeric(6, 2) not null default 0 check (default_pay_percent >= 0),
  lead_bonus_percent numeric(6, 2) not null default 10 check (lead_bonus_percent >= 0),
  trainee_pay_multiplier numeric(4, 2) not null default 0.75 check (trainee_pay_multiplier > 0),
  is_active boolean not null default true,
  performance_meta jsonb not null default '{}'::jsonb,
  equipment_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crew_members_status_idx on public.crew_members (status);
create index if not exists crew_members_role_idx on public.crew_members (role);
create index if not exists crew_members_active_idx on public.crew_members (is_active);

alter table public.crew_members enable row level security;
