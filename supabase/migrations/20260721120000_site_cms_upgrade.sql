-- Site CMS upgrade: services, projects, homepage settings, leads pipeline, user roles

BEGIN;

-- ── User roles (owner / future editor / staff) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'editor', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_user_roles ON public.user_roles;
CREATE POLICY admin_all_user_roles ON public.user_roles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_user_roles ON public.user_roles;
CREATE POLICY service_role_all_user_roles ON public.user_roles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Site services ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  authority_intro text NOT NULL DEFAULT '',
  best_for text NOT NULL DEFAULT '',
  included jsonb NOT NULL DEFAULT '[]'::jsonb,
  add_ons jsonb NOT NULL DEFAULT '[]'::jsonb,
  who_its_for jsonb NOT NULL DEFAULT '[]'::jsonb,
  process_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  pricing_mode text NOT NULL DEFAULT 'starting_at'
    CHECK (pricing_mode IN ('starting_at', 'custom_estimate', 'hidden')),
  pricing_label text NOT NULL DEFAULT '',
  cta_headline text NOT NULL DEFAULT 'Request a free estimate',
  cta_body text NOT NULL DEFAULT '',
  cover_image_url text,
  cover_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  water_access_note text,
  seo_title text,
  seo_description text,
  display_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_services_slug_idx ON public.site_services(slug);
CREATE INDEX IF NOT EXISTS site_services_active_order_idx
  ON public.site_services(is_active, display_order);

CREATE TABLE IF NOT EXISTS public.site_service_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.site_services(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_service_faqs_service_idx
  ON public.site_service_faqs(service_id, sort_order);

CREATE TABLE IF NOT EXISTS public.site_service_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.site_services(id) ON DELETE CASCADE,
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, media_asset_id)
);

-- ── Site projects ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text,
  completion_date date,
  service_categories text[] NOT NULL DEFAULT '{}',
  short_summary text NOT NULL DEFAULT '',
  long_description text NOT NULL DEFAULT '',
  cover_image_url text,
  cover_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  testimonial text,
  testimonial_author text,
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_projects_slug_idx ON public.site_projects(slug);
CREATE INDEX IF NOT EXISTS site_projects_published_idx
  ON public.site_projects(is_published, sort_order);

CREATE TABLE IF NOT EXISTS public.site_project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.site_projects(id) ON DELETE CASCADE,
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  gallery_phase text NOT NULL DEFAULT 'general'
    CHECK (gallery_phase IN ('before', 'during', 'after', 'general')),
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, media_asset_id)
);

CREATE INDEX IF NOT EXISTS site_project_media_project_idx
  ON public.site_project_media(project_id, gallery_phase, sort_order);

-- ── Homepage settings (single-row controlled editor) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.site_homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_eyebrow text NOT NULL DEFAULT 'Palm Beach Property Pros',
  hero_headline text NOT NULL DEFAULT 'Professional Cleaning & Property Care in Palm Beach County',
  hero_subheadline text NOT NULL DEFAULT '',
  hero_primary_cta_label text NOT NULL DEFAULT 'Request a Free Estimate',
  hero_secondary_cta_label text NOT NULL DEFAULT 'Call or Text',
  trust_microcopy text NOT NULL DEFAULT 'Free estimates • Photo uploads • Clear communication',
  trust_statements jsonb NOT NULL DEFAULT '[]'::jsonb,
  service_area_content text NOT NULL DEFAULT '',
  closing_cta_headline text NOT NULL DEFAULT '',
  closing_cta_body text NOT NULL DEFAULT '',
  section_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  section_visibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  hero_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  featured_service_ids uuid[] NOT NULL DEFAULT '{}',
  featured_project_ids uuid[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote text NOT NULL,
  author text NOT NULL DEFAULT '',
  location text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Extend media_assets ───────────────────────────────────────────────────────
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS gallery_phase text
    CHECK (gallery_phase IS NULL OR gallery_phase IN ('before', 'during', 'after', 'general')),
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS avif_url text,
  ADD COLUMN IF NOT EXISTS blur_data_url text,
  ADD COLUMN IF NOT EXISTS original_storage_path text,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.site_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.site_services(id) ON DELETE SET NULL;

-- ── Extend quote_requests (leads pipeline) ────────────────────────────────────
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS services_requested jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS water_spigot_available text
    CHECK (water_spigot_available IS NULL OR water_spigot_available IN ('yes', 'no', 'unsure')),
  ADD COLUMN IF NOT EXISTS requires_alternate_water boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alternate_water_notes text;

-- Migrate legacy statuses
ALTER TABLE public.quote_requests DROP CONSTRAINT IF EXISTS quote_requests_status_check;
UPDATE public.quote_requests SET status = 'estimate_sent' WHERE status = 'quoted';
UPDATE public.quote_requests SET status = 'completed' WHERE status = 'won';

ALTER TABLE public.quote_requests ADD CONSTRAINT quote_requests_status_check CHECK (
  status IN (
    'new', 'contacted', 'site_visit_scheduled', 'estimate_sent',
    'approved', 'scheduled', 'completed', 'lost'
  )
);

-- Backfill services_requested from service_requested
UPDATE public.quote_requests
SET services_requested = jsonb_build_array(service_requested)
WHERE jsonb_array_length(services_requested) = 0
  AND service_requested IS NOT NULL
  AND trim(service_requested) <> '';

-- ── RLS for new tables ────────────────────────────────────────────────────────
ALTER TABLE public.site_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_service_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_service_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_homepage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_testimonials ENABLE ROW LEVEL SECURITY;

-- Admin full access
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'site_services', 'site_service_faqs', 'site_service_media',
    'site_projects', 'site_project_media',
    'site_homepage_settings', 'site_testimonials'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS admin_all_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY admin_all_%I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS service_role_all_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY service_role_all_%I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;

-- Public read for active/published content
DROP POLICY IF EXISTS anon_read_site_services ON public.site_services;
CREATE POLICY anon_read_site_services ON public.site_services
  FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS anon_read_site_service_faqs ON public.site_service_faqs;
CREATE POLICY anon_read_site_service_faqs ON public.site_service_faqs
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.site_services s WHERE s.id = service_id AND s.is_active = true)
  );

DROP POLICY IF EXISTS anon_read_site_projects ON public.site_projects;
CREATE POLICY anon_read_site_projects ON public.site_projects
  FOR SELECT TO anon USING (is_published = true);

DROP POLICY IF EXISTS anon_read_site_homepage ON public.site_homepage_settings;
CREATE POLICY anon_read_site_homepage ON public.site_homepage_settings
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS anon_read_site_testimonials ON public.site_testimonials;
CREATE POLICY anon_read_site_testimonials ON public.site_testimonials
  FOR SELECT TO anon USING (is_active = true);

-- ── Updated public quote RPC ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_public_quote_request(
  p_name text,
  p_phone text,
  p_email text,
  p_service_requested text,
  p_address text,
  p_city text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_preferred_contact text DEFAULT 'Call',
  p_preferred_date date DEFAULT NULL,
  p_preferred_time text DEFAULT NULL,
  p_source text DEFAULT 'website',
  p_referrer text DEFAULT NULL,
  p_services_requested jsonb DEFAULT NULL,
  p_water_spigot_available text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_services jsonb;
BEGIN
  IF p_name IS NULL OR trim(p_name) = '' THEN RAISE EXCEPTION 'name is required'; END IF;
  IF p_phone IS NULL OR trim(p_phone) = '' THEN RAISE EXCEPTION 'phone is required'; END IF;
  IF p_address IS NULL OR trim(p_address) = '' THEN RAISE EXCEPTION 'address is required'; END IF;

  v_services := COALESCE(p_services_requested, '[]'::jsonb);
  IF jsonb_array_length(v_services) = 0 THEN
    IF p_service_requested IS NULL OR trim(p_service_requested) = '' THEN
      RAISE EXCEPTION 'service is required';
    END IF;
    v_services := jsonb_build_array(trim(p_service_requested));
  END IF;

  IF p_water_spigot_available IS NOT NULL
     AND p_water_spigot_available NOT IN ('yes', 'no', 'unsure') THEN
    RAISE EXCEPTION 'invalid water_spigot_available value';
  END IF;

  INSERT INTO public.quote_requests (
    name, phone, email,
    service_requested,
    services_requested,
    address, city, property_type, message,
    preferred_contact, preferred_date, preferred_time,
    source, referrer,
    water_spigot_available,
    status, photo_urls
  ) VALUES (
    trim(p_name), trim(p_phone),
    NULLIF(trim(coalesce(p_email, '')), ''),
    v_services->>0,
    v_services,
    trim(p_address),
    NULLIF(trim(coalesce(p_city, '')), ''),
    NULLIF(trim(coalesce(p_property_type, '')), ''),
    NULLIF(trim(coalesce(p_message, '')), ''),
    COALESCE(NULLIF(trim(coalesce(p_preferred_contact, '')), ''), 'Call'),
    p_preferred_date,
    NULLIF(trim(coalesce(p_preferred_time, '')), ''),
    COALESCE(NULLIF(trim(coalesce(p_source, '')), ''), 'website'),
    NULLIF(trim(coalesce(p_referrer, '')), ''),
    p_water_spigot_available,
    'new',
    '[]'::jsonb
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_quote_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_quote_request TO anon, authenticated, service_role;

-- ── Seed homepage settings row ────────────────────────────────────────────────
INSERT INTO public.site_homepage_settings (
  hero_eyebrow,
  hero_headline,
  hero_subheadline,
  hero_primary_cta_label,
  hero_secondary_cta_label,
  trust_microcopy,
  trust_statements,
  service_area_content,
  closing_cta_headline,
  closing_cta_body,
  section_order,
  section_visibility
) VALUES (
  'Palm Beach Property Pros',
  'Professional Cleaning & Property Care in Palm Beach County',
  'Complete window detailing, pressure washing, property cleanups, lawn care, detailing, and ongoing maintenance—delivered with clear communication and photo-backed scope.',
  'Request a Free Estimate',
  'Call or Text',
  'Free estimates • Photo uploads • Clear communication',
  '["Licensed & insured","Palm Beach County operations","Documented field execution","Free estimates on request"]'::jsonb,
  'We serve homeowners, estates, property managers, and commercial clients throughout Palm Beach County.',
  'Ready for a free estimate?',
  'Share your property details and photos—we respond with scope-based pricing and clear next steps.',
  '["hero","featured_services","trust","featured_projects","testimonials","service_area","closing_cta"]'::jsonb,
  '{"hero":true,"featured_services":true,"trust":true,"featured_projects":true,"testimonials":true,"service_area":true,"closing_cta":true}'::jsonb
)
ON CONFLICT DO NOTHING;

COMMIT;
