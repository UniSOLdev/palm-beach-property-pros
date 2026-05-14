-- Palm Beach Property Pros operations schema (Supabase-ready baseline)
-- Intended as a starting point: add RLS policies, auth wiring, and storage buckets separately.

create extension if not exists "pgcrypto";

create table if not exists business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Palm Beach Property Pros',
  phone text,
  email text,
  website text,
  logo_url text,
  address text,
  google_review_url text,
  default_invoice_terms text,
  default_quote_terms text,
  payment_methods_accepted text[] default array['Cash','Zelle','Card','Check']::text[],
  brand_primary text default '#0C2340',
  brand_accent text default '#6A8F6B',
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  client_type text not null,
  referral_source text,
  notes text,
  follow_up_date date,
  review_status text not null default 'Not sent',
  created_at timestamptz not null default now()
);

create table if not exists crew_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  role text,
  default_pay_rate numeric not null default 0,
  pay_rate_unit text not null default 'hour',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete restrict,
  service_type text not null,
  address text not null,
  job_date date not null,
  start_time text,
  end_time text,
  status text not null,
  assigned_crew_ids uuid[] default array[]::uuid[],
  job_notes text,
  internal_notes text,
  before_photo_urls text[] default array[]::text[],
  after_photo_urls text[] default array[]::text[],
  quote_id uuid,
  invoice_id uuid,
  revenue numeric not null default 0,
  job_expense_total numeric not null default 0,
  payment_method text,
  review_requested boolean not null default false,
  referral_source text,
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  quote_number text not null unique,
  client_id uuid not null references clients (id) on delete restrict,
  job_address text not null,
  service_type text not null,
  notes text,
  terms text,
  expiration_date date,
  status text not null,
  deposit_required boolean not null default false,
  deposit_amount numeric not null default 0,
  internal_notes text,
  invoice_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  is_addon boolean not null default false,
  sort_order int not null default 0
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  invoice_number text not null unique,
  client_id uuid not null references clients (id) on delete restrict,
  job_id uuid references jobs (id) on delete set null,
  quote_id uuid references quotes (id) on delete set null,
  discount numeric not null default 0,
  deposit_paid numeric not null default 0,
  payment_status text not null,
  payment_method text,
  paid_date date,
  notes text,
  terms text,
  review_request_status text not null default 'Not sent',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  sort_order int not null default 0
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  category text not null,
  vendor text not null,
  description text not null,
  amount numeric not null,
  payment_method text not null,
  job_id uuid references jobs (id) on delete set null,
  receipt_url text,
  expense_type text not null,
  reimbursable boolean not null default false,
  reimbursed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists sop_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  estimated_minutes int not null default 0,
  supplies_needed jsonb not null default '[]'::jsonb,
  crew_roles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sop_checklists (
  id uuid primary key default gen_random_uuid(),
  sop_template_id uuid not null references sop_templates (id) on delete cascade,
  section text not null,
  items jsonb not null default '[]'::jsonb,
  sort_order int not null default 0
);

create table if not exists supplies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  quantity numeric not null default 0,
  unit text not null,
  storage_location text,
  reorder_level numeric not null default 0,
  cost numeric not null default 0,
  vendor text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists crew_payouts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  crew_member_ids uuid[] not null,
  pay_type text not null,
  hours numeric,
  percent numeric,
  flat_amount numeric,
  calculated_total numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Optional: enforce links between jobs/quotes/invoices once you are comfortable with creation order.
-- alter table jobs add constraint jobs_quote_fk foreign key (quote_id) references quotes (id);
-- alter table jobs add constraint jobs_invoice_fk foreign key (invoice_id) references invoices (id);
-- alter table quotes add constraint quotes_invoice_fk foreign key (invoice_id) references invoices (id);
