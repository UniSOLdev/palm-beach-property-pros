-- PBPP platform upgrade: estimates, scheduling, CRM, service areas, reviews

BEGIN;

-- ── Quote estimate fields ─────────────────────────────────────────────────────
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS discount_type text CHECK (discount_type IS NULL OR discount_type IN ('percent', 'fixed')),
  ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate numeric NOT NULL DEFAULT 0;

-- ── Job review tracking ───────────────────────────────────────────────────────
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS review_request_status text NOT NULL DEFAULT 'none'
    CHECK (review_request_status IN ('none', 'pending', 'sent', 'completed')),
  ADD COLUMN IF NOT EXISTS review_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS thank_you_sent_at timestamptz;

-- ── Client CRM extensions ─────────────────────────────────────────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS service_reminder_notes text,
  ADD COLUMN IF NOT EXISTS lifetime_value numeric NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.client_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (
    activity_type IN ('note', 'call', 'text', 'email', 'job', 'quote', 'invoice', 'review', 'reminder', 'system')
  ),
  body text,
  metadata jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_activity_client_idx
  ON public.client_activity(client_id, created_at DESC);

-- ── Service areas (CMS-managed) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  area_type text NOT NULL DEFAULT 'city'
    CHECK (area_type IN ('city', 'county', 'zip')),
  county text,
  zip_codes text[] NOT NULL DEFAULT '{}',
  seo_title text,
  seo_description text,
  hero_headline text,
  body_content text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_areas_active_idx ON public.service_areas(is_active, sort_order);

-- Seed from existing SERVICE_CITIES constant
INSERT INTO public.service_areas (name, slug, area_type, county, hero_headline, body_content, sort_order)
VALUES
  ('West Palm Beach', 'west-palm-beach', 'city', 'Palm Beach County',
   'Property Care in West Palm Beach',
   'Professional window detailing, pressure washing, and property maintenance in West Palm Beach.',
   1),
  ('Palm Beach Gardens', 'palm-beach-gardens', 'city', 'Palm Beach County',
   'Property Care in Palm Beach Gardens',
   'Complete window detailing, pressure washing, and estate services in Palm Beach Gardens.',
   2),
  ('Jupiter', 'jupiter', 'city', 'Palm Beach County',
   'Property Care in Jupiter',
   'Window detailing, pressure washing, and property care throughout Jupiter and nearby coastal areas.',
   3),
  ('Boynton Beach', 'boynton-beach', 'city', 'Palm Beach County',
   'Property Care in Boynton Beach',
   'Reliable cleaning and exterior services for Boynton Beach homes and businesses.',
   4),
  ('Delray Beach', 'delray-beach', 'city', 'Palm Beach County',
   'Property Care in Delray Beach',
   'Window detailing, pressure washing, and maintenance programs in Delray Beach.',
   5)
ON CONFLICT (slug) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.client_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_client_activity ON public.client_activity;
CREATE POLICY admin_all_client_activity ON public.client_activity
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_client_activity ON public.client_activity;
CREATE POLICY service_role_all_client_activity ON public.client_activity
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_service_areas ON public.service_areas;
CREATE POLICY admin_all_service_areas ON public.service_areas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_read_service_areas ON public.service_areas;
CREATE POLICY anon_read_service_areas ON public.service_areas
  FOR SELECT TO anon USING (is_active = true);

COMMIT;
