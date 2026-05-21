-- Job files + pipeline stage (additive)

alter table public.jobs
  add column if not exists pipeline_stage text not null default 'lead';

create index if not exists jobs_pipeline_stage_idx on public.jobs (pipeline_stage, updated_at desc);

create table if not exists public.job_files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  invoice_id uuid references public.invoices (id) on delete set null,
  file_type text not null default 'photo',
  storage_path text not null,
  mime_type text,
  file_name text,
  caption text,
  uploaded_by text,
  created_at timestamptz not null default now()
);

create index if not exists job_files_job_idx on public.job_files (job_id, created_at desc);

alter table public.job_files enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ops-files',
  'ops-files',
  false,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'application/pdf',
    'text/csv'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
