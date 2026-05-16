-- PBPP admin tasks / to-do (additive, non-destructive)

create table if not exists public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'Open',
  priority text not null default 'Normal',
  category text,
  due_date date,
  due_time text,
  assigned_crew_member_id uuid,
  client_id uuid,
  job_id uuid,
  quote_id uuid,
  invoice_id uuid,
  internal_notes text,
  completed_at timestamptz,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_tasks_status_chk check (
    status in ('Open', 'In Progress', 'Waiting', 'Completed', 'Cancelled')
  ),
  constraint admin_tasks_priority_chk check (
    priority in ('Low', 'Normal', 'High', 'Urgent')
  )
);

create index if not exists admin_tasks_status_idx on public.admin_tasks (status) where not archived;
create index if not exists admin_tasks_due_date_idx on public.admin_tasks (due_date) where not archived;
create index if not exists admin_tasks_priority_idx on public.admin_tasks (priority) where not archived;
create index if not exists admin_tasks_client_idx on public.admin_tasks (client_id) where client_id is not null;
create index if not exists admin_tasks_job_idx on public.admin_tasks (job_id) where job_id is not null;

alter table public.admin_tasks enable row level security;

-- Seed examples when table is empty (idempotent)
insert into public.admin_tasks (
  title, description, status, priority, category, due_date, internal_notes
)
select * from (
  values
    (
      'Follow up with Neil about final trash removal',
      'Confirm scope completion and whether a return visit is needed.',
      'Open',
      'High',
      'Job Follow-Up',
      current_date,
      null::text
    ),
    (
      'Send invoice payment reminder',
      'Friendly reminder with Zelle / card options once configured.',
      'Open',
      'Normal',
      'Invoice Follow-Up',
      current_date + 1,
      null::text
    ),
    (
      'Restock microfiber towels',
      'Ops depot — check loadout bins for detailing crews.',
      'Open',
      'Normal',
      'Supplies / Inventory',
      current_date,
      null::text
    ),
    (
      'Upload before/after photos from move-out clean',
      'Attach to job record for manager sign-off.',
      'In Progress',
      'High',
      'Cleaning Job',
      current_date,
      null::text
    ),
    (
      'Call Square/Zelle setup for PBPP payments',
      'Owner admin — document merchant account for invoice CTAs.',
      'Waiting',
      'Urgent',
      'Admin',
      current_date - 1,
      null::text
    ),
    (
      'Schedule pressure washing quote',
      'Request photos of driveways and pool deck; send written scope.',
      'Open',
      'Normal',
      'Quote Follow-Up',
      current_date + 2,
      null::text
    ),
    (
      'Review crew payout for completed job',
      'Verify hours and split before marking payout pending.',
      'Open',
      'High',
      'Crew',
      current_date + 3,
      null::text
    )
) as seed(title, description, status, priority, category, due_date, internal_notes)
where not exists (select 1 from public.admin_tasks limit 1);
