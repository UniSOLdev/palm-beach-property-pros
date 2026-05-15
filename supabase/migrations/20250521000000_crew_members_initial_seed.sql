-- Idempotent PBPP initial roster seed. Inserts each person only if no row exists
-- with the same normalized full name. Admins may edit or deactivate; seed does not re-run.

insert into public.crew_members (
  full_name,
  role,
  status,
  skill_level,
  notes,
  certifications,
  availability_notes,
  default_pay_type,
  default_pay_rate_cents,
  default_pay_percent,
  lead_bonus_percent,
  trainee_pay_multiplier,
  is_active,
  performance_meta
)
select
  'Clayton Reid',
  'lead_tech',
  'available',
  'lead',
  'Initial roster seed — update pay, notes, and visibility in PBPP Operations as needed.',
  null,
  null,
  'percentage',
  0,
  42,
  12,
  1,
  true,
  jsonb_build_object(
    'seed_marker',
    'pbpp_initial_roster_v1',
    'display_roles',
    jsonb_build_array('Operations lead', 'Lead tech'),
    'skills',
    jsonb_build_array(
      'detailing',
      'client communication',
      'QC',
      'pressure washing',
      'operations'
    ),
    'avatar_url',
    null,
    'assignment_visibility',
    'full',
    'permissions',
    '{}'::jsonb
  )
where not exists (
    select 1
    from public.crew_members c
    where lower(trim(c.full_name)) = lower(trim('Clayton Reid'))
  );

insert into public.crew_members (
  full_name,
  role,
  status,
  skill_level,
  notes,
  certifications,
  availability_notes,
  default_pay_type,
  default_pay_rate_cents,
  default_pay_percent,
  lead_bonus_percent,
  trainee_pay_multiplier,
  is_active,
  performance_meta
)
select
  'Raymond',
  'detail_tech',
  'available',
  'senior',
  'Initial roster seed — update pay, notes, and visibility in PBPP Operations as needed.',
  null,
  null,
  'hourly',
  2600,
  0,
  10,
  1,
  true,
  jsonb_build_object(
    'seed_marker',
    'pbpp_initial_roster_v1',
    'display_roles',
    jsonb_build_array('Detail tech', 'Field tech'),
    'skills',
    jsonb_build_array('interior detailing', 'extraction', 'cleaning', 'dealership work'),
    'avatar_url',
    null,
    'assignment_visibility',
    'full',
    'permissions',
    '{}'::jsonb
  )
where not exists (
    select 1
    from public.crew_members c
    where lower(trim(c.full_name)) = lower(trim('Raymond'))
  );

insert into public.crew_members (
  full_name,
  role,
  status,
  skill_level,
  notes,
  certifications,
  availability_notes,
  default_pay_type,
  default_pay_rate_cents,
  default_pay_percent,
  lead_bonus_percent,
  trainee_pay_multiplier,
  is_active,
  performance_meta
)
select
  'Allen',
  'utility',
  'available',
  'intermediate',
  'Initial roster seed — update pay, notes, and visibility in PBPP Operations as needed.',
  null,
  null,
  'hourly',
  2400,
  0,
  10,
  1,
  true,
  jsonb_build_object(
    'seed_marker',
    'pbpp_initial_roster_v1',
    'display_roles',
    jsonb_build_array('Utility tech', 'Field support'),
    'skills',
    jsonb_build_array('moving', 'trash removal', 'support tasks', 'setup'),
    'avatar_url',
    null,
    'assignment_visibility',
    'full',
    'permissions',
    '{}'::jsonb
  )
where not exists (
    select 1
    from public.crew_members c
    where lower(trim(c.full_name)) = lower(trim('Allen'))
  );

insert into public.crew_members (
  full_name,
  role,
  status,
  skill_level,
  notes,
  certifications,
  availability_notes,
  default_pay_type,
  default_pay_rate_cents,
  default_pay_percent,
  lead_bonus_percent,
  trainee_pay_multiplier,
  is_active,
  performance_meta
)
select
  'Czean',
  'cleaning_tech',
  'available',
  'intermediate',
  'Initial roster seed — update pay, notes, and visibility in PBPP Operations as needed.',
  null,
  null,
  'hourly',
  2400,
  0,
  10,
  1,
  true,
  jsonb_build_object(
    'seed_marker',
    'pbpp_initial_roster_v1',
    'display_roles',
    jsonb_build_array('Cleaning tech', 'Utility'),
    'skills',
    jsonb_build_array('residential cleaning', 'turnovers', 'support'),
    'avatar_url',
    null,
    'assignment_visibility',
    'full',
    'permissions',
    '{}'::jsonb
  )
where not exists (
    select 1
    from public.crew_members c
    where lower(trim(c.full_name)) = lower(trim('Czean'))
  );

insert into public.crew_members (
  full_name,
  role,
  status,
  skill_level,
  notes,
  certifications,
  availability_notes,
  default_pay_type,
  default_pay_rate_cents,
  default_pay_percent,
  lead_bonus_percent,
  trainee_pay_multiplier,
  is_active,
  performance_meta
)
select
  'Anthony',
  'detail_tech',
  'available',
  'senior',
  'Initial roster seed — update pay, notes, and visibility in PBPP Operations as needed.',
  null,
  null,
  'hourly',
  2500,
  0,
  10,
  1,
  true,
  jsonb_build_object(
    'seed_marker',
    'pbpp_initial_roster_v1',
    'display_roles',
    jsonb_build_array('Ops support', 'Detail tech'),
    'skills',
    jsonb_build_array('detailing', 'organization', 'setup', 'operations support'),
    'avatar_url',
    null,
    'assignment_visibility',
    'full',
    'permissions',
    '{}'::jsonb
  )
where not exists (
    select 1
    from public.crew_members c
    where lower(trim(c.full_name)) = lower(trim('Anthony'))
  );

insert into public.crew_members (
  full_name,
  role,
  status,
  skill_level,
  notes,
  certifications,
  availability_notes,
  default_pay_type,
  default_pay_rate_cents,
  default_pay_percent,
  lead_bonus_percent,
  trainee_pay_multiplier,
  is_active,
  performance_meta
)
select
  'Brody',
  'trainee',
  'available',
  'trainee',
  'Initial roster seed — update pay, notes, and visibility in PBPP Operations as needed.',
  null,
  null,
  'hourly',
  1800,
  0,
  10,
  0.75,
  true,
  jsonb_build_object(
    'seed_marker',
    'pbpp_initial_roster_v1',
    'display_roles',
    jsonb_build_array('Trainee', 'General support'),
    'skills',
    jsonb_build_array('support', 'learning', 'setup assistance'),
    'avatar_url',
    null,
    'assignment_visibility',
    'full',
    'permissions',
    '{}'::jsonb
  )
where not exists (
    select 1
    from public.crew_members c
    where lower(trim(c.full_name)) = lower(trim('Brody'))
  );
