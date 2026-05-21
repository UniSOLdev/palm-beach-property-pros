-- Field operations task system for job checklists, crew assignments, recurrence, and activity.
-- Service-role API routes manage these rows; RLS remains enabled for browser safety.

create table if not exists public.operational_tasks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  title text not null,
  status text not null default 'todo',
  priority text not null default 'normal',
  priority_rank integer not null default 0,
  due_at timestamptz,
  recurring_rule text,
  assigned_crew_member_id uuid references public.crew_members (id) on delete set null,
  assigned_crew_name text,
  completion_photo_urls jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  activity_log jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operational_tasks_status_chk check (status in ('todo', 'scheduled', 'in_progress', 'blocked', 'done', 'cancelled')),
  constraint operational_tasks_priority_chk check (priority in ('urgent', 'high', 'normal', 'low'))
);

create index if not exists operational_tasks_job_rank_idx on public.operational_tasks (job_id, priority_rank asc, created_at asc);
create index if not exists operational_tasks_job_status_idx on public.operational_tasks (job_id, status);
create index if not exists operational_tasks_due_idx on public.operational_tasks (due_at) where due_at is not null;
create index if not exists operational_tasks_crew_idx on public.operational_tasks (assigned_crew_member_id) where assigned_crew_member_id is not null;

alter table public.operational_tasks enable row level security;
