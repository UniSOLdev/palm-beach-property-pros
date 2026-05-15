-- Quotes + immutable quote→invoice conversion (atomic RPC)
-- Apply after 20250515000000_clients_invoices.sql

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  service_type text,
  property_address text,
  notes text,
  customer_notes text,
  terms text,
  internal_notes text,
  line_items jsonb not null default '[]'::jsonb,
  subtotal_cents integer not null default 0,
  tax_cents integer not null default 0,
  discount_cents integer not null default 0,
  deposit_cents integer not null default 0,
  total_cents integer not null default 0,
  status text not null default 'draft',
  reference_code text unique,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_status_chk check (status in ('draft', 'sent', 'approved', 'converted', 'void'))
);

create index if not exists quotes_client_idx on public.quotes (client_id, updated_at desc);
create index if not exists quotes_status_idx on public.quotes (status);

alter table public.invoices
  add column if not exists discount_cents integer not null default 0;

alter table public.invoices
  add column if not exists deposit_cents integer not null default 0;

alter table public.invoices
  add column if not exists quote_id uuid references public.quotes (id) on delete set null;

alter table public.invoices
  add column if not exists conversion_snapshot jsonb;

alter table public.invoices
  add column if not exists converted_from_quote_at timestamptz;

alter table public.invoices
  add column if not exists quote_reference_code text;

create unique index if not exists invoices_quote_id_unique on public.invoices (quote_id)
  where quote_id is not null;

create table if not exists public.quote_conversion_audit (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists quote_conversion_audit_quote_idx on public.quote_conversion_audit (quote_id);

alter table public.quotes enable row level security;

-- Atomic conversion: row lock, immutable snapshot, single invoice per quote
create or replace function public.convert_quote_to_invoice(p_quote_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q quotes%rowtype;
  new_inv_id uuid;
  new_token text;
  snap jsonb;
  inv_title text;
begin
  select * into q from quotes where id = p_quote_id for update;
  if not found then
    raise exception 'QUOTE_NOT_FOUND';
  end if;

  if q.status = 'converted' then
    raise exception 'QUOTE_ALREADY_CONVERTED';
  end if;

  if q.status = 'void' then
    raise exception 'QUOTE_VOID';
  end if;

  snap := to_jsonb(q);

  inv_title := coalesce(
    'Invoice — Quote ' || coalesce(q.reference_code, left(replace(q.id::text, '-', ''), 12)),
    'Invoice'
  );

  insert into invoices (
    client_id,
    title,
    status,
    currency,
    line_items,
    subtotal_cents,
    tax_cents,
    discount_cents,
    deposit_cents,
    total_cents,
    quote_id,
    conversion_snapshot,
    converted_from_quote_at,
    quote_reference_code
  )
  values (
    q.client_id,
    inv_title,
    'draft',
    'usd',
    q.line_items,
    q.subtotal_cents,
    q.tax_cents,
    coalesce(q.discount_cents, 0),
    coalesce(q.deposit_cents, 0),
    q.total_cents,
    p_quote_id,
    snap,
    now(),
    q.reference_code
  )
  returning id, public_token into new_inv_id, new_token;

  update quotes
  set
    status = 'converted',
    updated_at = now(),
    row_version = row_version + 1
  where id = p_quote_id;

  insert into quote_conversion_audit (quote_id, invoice_id, snapshot)
  values (p_quote_id, new_inv_id, snap);

  return jsonb_build_object(
    'invoice_id', new_inv_id,
    'public_token', new_token,
    'quote_id', p_quote_id
  );
end;
$$;

revoke all on function public.convert_quote_to_invoice(uuid) from public;
grant execute on function public.convert_quote_to_invoice(uuid) to service_role;
