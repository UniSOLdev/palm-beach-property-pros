-- Palm Beach Property Pros — CRM clients + invoices (Supabase)
-- Server-side admin uses the service role key (bypasses RLS).
-- No anon policies: public invoice pages load via server-only service client.

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_full_name_idx on public.clients (lower(full_name));
create index if not exists clients_email_idx on public.clients (lower(email)) where email is not null;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  title text not null,
  status text not null default 'scheduled',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists jobs_client_id_idx on public.jobs (client_id, created_at desc);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  title text,
  status text not null default 'draft',
  currency text not null default 'usd',
  line_items jsonb not null default '[]'::jsonb,
  subtotal_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  public_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_client_id_idx on public.invoices (client_id, created_at desc);
create index if not exists invoices_public_token_idx on public.invoices (public_token);

alter table public.clients enable row level security;
alter table public.jobs enable row level security;
alter table public.invoices enable row level security;
