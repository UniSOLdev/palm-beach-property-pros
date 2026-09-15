-- Employee hub: time clock, referral incentives, inventory count audit trail

ALTER TABLE public.crew_members
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_bonus_flat numeric NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS referral_bonus_percent numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS crew_members_user_id_idx ON public.crew_members(user_id);

CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id uuid NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS time_entries_crew_idx ON public.time_entries(crew_member_id, clock_in DESC);
CREATE INDEX IF NOT EXISTS time_entries_open_idx ON public.time_entries(crew_member_id)
  WHERE clock_out IS NULL;

CREATE TABLE IF NOT EXISTS public.crew_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id uuid NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_phone text,
  contact_email text,
  service_requested text,
  description text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'declined')),
  incentive_amount numeric,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crew_referrals_crew_idx ON public.crew_referrals(crew_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crew_referrals_status_idx ON public.crew_referrals(status);

CREATE TABLE IF NOT EXISTS public.supply_count_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id uuid NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  crew_member_id uuid REFERENCES public.crew_members(id) ON DELETE SET NULL,
  previous_qty numeric NOT NULL,
  counted_qty numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS supply_count_logs_supply_idx ON public.supply_count_logs(supply_id, created_at DESC);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_count_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_time_entries ON public.time_entries;
CREATE POLICY admin_all_time_entries ON public.time_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_crew_referrals ON public.crew_referrals;
CREATE POLICY admin_all_crew_referrals ON public.crew_referrals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_supply_count_logs ON public.supply_count_logs;
CREATE POLICY admin_all_supply_count_logs ON public.supply_count_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
