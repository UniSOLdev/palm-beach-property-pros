-- Site Studio — complete production bootstrap
-- Creates website_pages, website_sections, website_media, website_revisions,
-- website_theme, storage bucket, RLS, triggers, and homepage seed.
-- Idempotent — safe to re-run.

BEGIN;

-- ── Helpers ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pbpp_attach_updated_at(p_table regclass)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_trigger name;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table::text AND column_name = 'updated_at'
  ) THEN
    v_trigger := p_table::text || '_updated_at';
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', v_trigger, p_table);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      v_trigger, p_table
    );
  END IF;
END;
$$;

-- ── website_pages ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  page_type text NOT NULL DEFAULT 'page',
  seo_title text,
  meta_description text,
  og_image_url text,
  preview_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT website_pages_slug_unique UNIQUE (slug),
  CONSTRAINT website_pages_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT website_pages_page_type_check CHECK (
    page_type IN ('homepage', 'service', 'landing', 'city_seo', 'gallery', 'about', 'contact', 'page')
  )
);

CREATE INDEX IF NOT EXISTS website_pages_slug_idx ON public.website_pages(slug);
CREATE INDEX IF NOT EXISTS website_pages_status_idx ON public.website_pages(status);
CREATE INDEX IF NOT EXISTS website_pages_preview_token_idx ON public.website_pages(preview_token);

-- ── website_sections ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.website_pages(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  label text,
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT website_sections_type_check CHECK (
    section_type IN (
      'hero', 'services', 'gallery', 'before_after', 'testimonials', 'stats', 'faq',
      'cta', 'service_areas', 'pricing', 'process', 'team', 'video', 'quote_form',
      'contact', 'rich_text'
    )
  )
);

CREATE INDEX IF NOT EXISTS website_sections_page_idx ON public.website_sections(page_id, sort_order);

-- ── website_media ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.website_pages(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.website_sections(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text,
  alt_text text,
  caption text,
  width int,
  height int,
  file_size_bytes bigint,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_media_page_idx ON public.website_media(page_id, sort_order);
CREATE INDEX IF NOT EXISTS website_media_section_idx ON public.website_media(section_id);

-- ── website_revisions (publish snapshots) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.website_pages(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'published',
  published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT website_revisions_page_version_unique UNIQUE (page_id, version_number),
  CONSTRAINT website_revisions_status_check CHECK (status IN ('draft', 'published'))
);

CREATE INDEX IF NOT EXISTS website_revisions_page_idx ON public.website_revisions(page_id, created_at DESC);

-- Migrate legacy website_publish_history → website_revisions if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'website_publish_history'
  ) THEN
    INSERT INTO public.website_revisions (page_id, version_number, snapshot, status, published_by, note, created_at)
    SELECT page_id, version_number, snapshot, 'published', published_by, note, created_at
    FROM public.website_publish_history h
    WHERE NOT EXISTS (
      SELECT 1 FROM public.website_revisions r
      WHERE r.page_id = h.page_id AND r.version_number = h.version_number
    );
  END IF;
END $$;

-- ── website_theme (singleton tokens) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_theme (
  id text PRIMARY KEY DEFAULT 'default',
  tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  dark_mode_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.website_theme (id, tokens)
VALUES (
  'default',
  '{
    "colorPrimary": "#0f2a44",
    "colorAccent": "#1a5f7a",
    "colorBackground": "#f5f0e8",
    "colorSurface": "#ffffff",
    "radiusLg": "1rem",
    "shadowSoft": "0 4px 24px rgba(15,42,68,0.08)",
    "gradientHero": "linear-gradient(135deg, #0f2a44, #1a5f7a)"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ── updated_at triggers ──────────────────────────────────────────────────────
SELECT public.pbpp_attach_updated_at('public.website_pages'::regclass);
SELECT public.pbpp_attach_updated_at('public.website_sections'::regclass);
SELECT public.pbpp_attach_updated_at('public.website_media'::regclass);
SELECT public.pbpp_attach_updated_at('public.website_theme'::regclass);

-- ── Storage: website-media bucket ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-media',
  'website-media',
  true,
  20971520,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','video/mp4','video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_theme ENABLE ROW LEVEL SECURITY;

-- Admin full access (authenticated)
DROP POLICY IF EXISTS website_pages_admin_all ON public.website_pages;
CREATE POLICY website_pages_admin_all ON public.website_pages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS website_sections_admin_all ON public.website_sections;
CREATE POLICY website_sections_admin_all ON public.website_sections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS website_media_admin_all ON public.website_media;
CREATE POLICY website_media_admin_all ON public.website_media
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS website_revisions_admin_all ON public.website_revisions;
CREATE POLICY website_revisions_admin_all ON public.website_revisions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS website_theme_admin_all ON public.website_theme;
CREATE POLICY website_theme_admin_all ON public.website_theme
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role (server actions / preview)
DROP POLICY IF EXISTS website_pages_service_all ON public.website_pages;
CREATE POLICY website_pages_service_all ON public.website_pages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS website_sections_service_all ON public.website_sections;
CREATE POLICY website_sections_service_all ON public.website_sections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS website_media_service_all ON public.website_media;
CREATE POLICY website_media_service_all ON public.website_media
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS website_revisions_service_all ON public.website_revisions;
CREATE POLICY website_revisions_service_all ON public.website_revisions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS website_theme_service_all ON public.website_theme;
CREATE POLICY website_theme_service_all ON public.website_theme
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon: read published pages only
DROP POLICY IF EXISTS website_pages_anon_published ON public.website_pages;
CREATE POLICY website_pages_anon_published ON public.website_pages
  FOR SELECT TO anon USING (status = 'published');

DROP POLICY IF EXISTS website_media_anon_read ON public.website_media;
CREATE POLICY website_media_anon_read ON public.website_media
  FOR SELECT TO anon USING (true);

-- Storage policies for website-media
DROP POLICY IF EXISTS website_media_storage_admin ON storage.objects;
CREATE POLICY website_media_storage_admin ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'website-media')
  WITH CHECK (bucket_id = 'website-media');

DROP POLICY IF EXISTS website_media_storage_service ON storage.objects;
CREATE POLICY website_media_storage_service ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'website-media')
  WITH CHECK (bucket_id = 'website-media');

DROP POLICY IF EXISTS website_media_storage_anon_read ON storage.objects;
CREATE POLICY website_media_storage_anon_read ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'website-media');

DROP POLICY IF EXISTS website_media_storage_anon_insert ON storage.objects;
CREATE POLICY website_media_storage_anon_insert ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'website-media');

-- Extend consolidated admin storage policy
DROP POLICY IF EXISTS admin_storage_all ON storage.objects;
CREATE POLICY admin_storage_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = ANY (ARRAY[
    'receipts','job-media','cms-media','media-library','lead-media',
    'signed-documents','website-media'
  ]))
  WITH CHECK (bucket_id = ANY (ARRAY[
    'receipts','job-media','cms-media','media-library','lead-media',
    'signed-documents','website-media'
  ]));

-- ── Seed homepage ────────────────────────────────────────────────────────────
INSERT INTO public.website_pages (slug, title, page_type, seo_title, meta_description, status)
SELECT
  'home',
  'Homepage',
  'homepage',
  'Palm Beach Property Pros | Premium Property Care',
  'Residential, commercial, and coastal property services in Palm Beach County.',
  'draft'
WHERE NOT EXISTS (SELECT 1 FROM public.website_pages WHERE slug = 'home');

DO $$
DECLARE v_page_id uuid;
BEGIN
  SELECT id INTO v_page_id FROM public.website_pages WHERE slug = 'home' LIMIT 1;
  IF v_page_id IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.website_sections WHERE page_id = v_page_id) THEN
    INSERT INTO public.website_sections (page_id, section_type, label, sort_order, is_visible, content) VALUES
    (v_page_id, 'hero', 'Hero', 0, true, '{
      "eyebrow": "Premium Property Operations",
      "headline": "Property Care for Palm Beach Living",
      "subheadline": "Residential, commercial, and coastal property services delivered with professional crews, modern systems, and detail-focused execution.",
      "imageUrl": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80",
      "chips": ["Licensed & insured", "Residential & commercial", "Airbnb & turnover specialists", "Palm Beach County based"],
      "primaryCta": {"label": "Get a quote", "href": "/quote"},
      "secondaryCta": {"label": "Call us", "href": "tel:15616292617"}
    }'::jsonb),
    (v_page_id, 'services', 'Service Lines', 1, true, '{
      "headline": "Complete property care",
      "subheadline": "Exterior, interior, and operational support under one local team.",
      "columns": [
        {"title": "Exterior care", "body": "Curb presence, glass clarity, and exterior surfaces.", "links": [{"label": "Window cleaning", "href": "/services/window-cleaning"}, {"label": "Pressure washing", "href": "/services/pressure-washing"}]},
        {"title": "Interior care", "body": "Residences kept inspection-ready.", "links": [{"label": "Residential cleaning", "href": "/services/residential-cleaning"}]},
        {"title": "Property support", "body": "Turnovers and onsite support.", "links": [{"label": "Airbnb turnovers", "href": "/services/airbnb-services"}]}
      ]
    }'::jsonb),
    (v_page_id, 'testimonials', 'Testimonials', 2, true, '{
      "headline": "Trusted by Palm Beach property owners",
      "items": [{"quote": "Professional, reliable, and detail-focused every visit.", "author": "Homeowner, Jupiter", "rating": 5}]
    }'::jsonb),
    (v_page_id, 'gallery', 'Gallery', 3, true, '{"headline": "Recent projects", "items": []}'::jsonb),
    (v_page_id, 'cta', 'Final CTA', 4, true, '{
      "headline": "One team for everything your property needs",
      "body": "Call or request a quote — we respond quickly with clear scope and pricing.",
      "primaryCta": {"label": "Get a quote", "href": "/quote"},
      "phone": "561-629-2617"
    }'::jsonb);
  END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
