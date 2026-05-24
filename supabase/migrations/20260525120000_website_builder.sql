-- PBPP Visual Website Builder — pages, sections, theme, publish history, media upgrades

-- ── Pages ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  page_type text NOT NULL DEFAULT 'page' CHECK (
    page_type IN ('homepage', 'service', 'landing', 'city_seo', 'gallery', 'about', 'contact', 'page')
  ),
  seo_title text,
  meta_description text,
  og_image_url text,
  preview_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_pages_slug_idx ON public.website_pages(slug);
CREATE INDEX IF NOT EXISTS website_pages_preview_token_idx ON public.website_pages(preview_token);

-- ── Sections (draft workspace) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.website_pages(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (
    section_type IN (
      'hero', 'services', 'gallery', 'before_after', 'testimonials', 'stats', 'faq',
      'cta', 'service_areas', 'pricing', 'process', 'team', 'video', 'quote_form', 'contact'
    )
  ),
  label text,
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_sections_page_idx ON public.website_sections(page_id, sort_order);

-- ── Section repeater items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_section_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.website_sections(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  item_type text NOT NULL DEFAULT 'default',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_section_items_section_idx
  ON public.website_section_items(section_id, sort_order);

-- ── Theme tokens (singleton) ─────────────────────────────────────────────────
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
    "fontHeading": "Georgia, serif",
    "fontBody": "system-ui, sans-serif",
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

-- ── Publish history / rollback ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_publish_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.website_pages(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  snapshot jsonb NOT NULL,
  published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, version_number)
);

CREATE INDEX IF NOT EXISTS website_publish_history_page_idx
  ON public.website_publish_history(page_id, created_at DESC);

-- ── Media collections ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Extend media_assets metadata ─────────────────────────────────────────────
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS job_reference text,
  ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES public.media_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS webp_url text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS width int,
  ADD COLUMN IF NOT EXISTS height int;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_theme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_publish_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_website_pages ON public.website_pages;
CREATE POLICY admin_all_website_pages ON public.website_pages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_website_sections ON public.website_sections;
CREATE POLICY admin_all_website_sections ON public.website_sections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_website_section_items ON public.website_section_items;
CREATE POLICY admin_all_website_section_items ON public.website_section_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_website_theme ON public.website_theme;
CREATE POLICY admin_all_website_theme ON public.website_theme
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_website_publish_history ON public.website_publish_history;
CREATE POLICY admin_all_website_publish_history ON public.website_publish_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_media_collections ON public.media_collections;
CREATE POLICY admin_all_media_collections ON public.media_collections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public read published snapshots via service role only (preview uses token RPC)
DROP POLICY IF EXISTS anon_read_published_pages ON public.website_pages;
CREATE POLICY anon_read_published_pages ON public.website_pages
  FOR SELECT TO anon
  USING (status = 'published');

-- ── Seed homepage if missing ───────────────────────────────────────────────
INSERT INTO public.website_pages (slug, title, page_type, seo_title, meta_description, status)
SELECT
  'home',
  'Homepage',
  'homepage',
  'Palm Beach Property Pros | Premium Property Care',
  'Residential, commercial, and coastal property services in Palm Beach County.',
  'draft'
WHERE NOT EXISTS (SELECT 1 FROM public.website_pages WHERE slug = 'home');

-- Seed default sections for homepage (only if none exist)
DO $$
DECLARE
  v_page_id uuid;
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
    (v_page_id, 'stats', 'Trust Stats', 2, true, '{
      "items": [{"value": "500+", "label": "Properties served"}, {"value": "5★", "label": "Local reputation"}, {"value": "24hr", "label": "Quote response"}]
    }'::jsonb),
    (v_page_id, 'testimonials', 'Testimonials', 3, true, '{
      "headline": "Trusted by Palm Beach property owners",
      "items": [{"quote": "Professional, reliable, and detail-focused every visit.", "author": "Homeowner, Jupiter", "rating": 5}]
    }'::jsonb),
    (v_page_id, 'faq', 'FAQ', 4, true, '{"headline": "Common questions"}'::jsonb),
    (v_page_id, 'quote_form', 'Quote CTA', 5, true, '{
      "headline": "Ready for a written estimate?",
      "body": "Share your property details and we will follow up with scope and scheduling options.",
      "buttonLabel": "Request a quote",
      "buttonHref": "/quote"
    }'::jsonb),
    (v_page_id, 'cta', 'Final CTA', 6, true, '{
      "headline": "One team for everything your property needs",
      "body": "Call or request a quote — we respond quickly with clear scope and pricing.",
      "primaryCta": {"label": "Get a quote", "href": "/quote"},
      "phone": "561-629-2617"
    }'::jsonb);
  END IF;
END $$;
