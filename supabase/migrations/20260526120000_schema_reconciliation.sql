-- PBPP Schema Reconciliation — idempotent, data-preserving, transactional
-- Run AFTER all prior migrations. Safe to re-run on production.

BEGIN;

-- ── Helper: attach updated_at trigger if missing ─────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pbpp_attach_updated_at(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_trigger name;
BEGIN
  v_trigger := p_table::text || '_updated_at';
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table::text
      AND column_name = 'updated_at'
  ) THEN
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', v_trigger, p_table);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      v_trigger,
      p_table
    );
  END IF;
END;
$$;

-- ── quote_requests: ensure canonical columns (legacy rename repair) ──────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_requests') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'full_name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'name') THEN
      ALTER TABLE public.quote_requests RENAME COLUMN full_name TO name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'service')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'service_requested') THEN
      ALTER TABLE public.quote_requests RENAME COLUMN service TO service_requested;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'property_address')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'address') THEN
      ALTER TABLE public.quote_requests RENAME COLUMN property_address TO address;
    END IF;
  END IF;
END $$;

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS service_requested text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS preferred_contact text DEFAULT 'Call',
  ADD COLUMN IF NOT EXISTS preferred_date date,
  ADD COLUMN IF NOT EXISTS preferred_time text,
  ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS quote_id uuid,
  ADD COLUMN IF NOT EXISTS invoice_id uuid,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.quote_requests SET photo_urls = '[]'::jsonb WHERE photo_urls IS NULL;
UPDATE public.quote_requests SET archived = false WHERE archived IS NULL;
UPDATE public.quote_requests SET status = 'new' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS quote_requests_created_idx ON public.quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_archived_idx ON public.quote_requests(archived) WHERE archived = false;

SELECT public.pbpp_attach_updated_at('public.quote_requests'::regclass);

-- ── quotes: e-sign columns (241700 guard) ────────────────────────────────────
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_name text,
  ADD COLUMN IF NOT EXISTS signed_ip text,
  ADD COLUMN IF NOT EXISTS client_signature_url text,
  ADD COLUMN IF NOT EXISTS signed_pdf_url text,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz;

UPDATE public.quotes SET approval_status = 'pending' WHERE approval_status IS NULL;

ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_approval_status_check;
ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_approval_status_check
  CHECK (approval_status IN ('pending', 'viewed', 'signed', 'declined'));

CREATE INDEX IF NOT EXISTS quotes_public_id_idx ON public.quotes(public_id);
CREATE INDEX IF NOT EXISTS quotes_approval_status_idx ON public.quotes(approval_status);

-- ── quote_events ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  type text NOT NULL,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_events_quote_id_idx
  ON public.quote_events(quote_id, created_at DESC);

ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;

-- ── website builder tables (251200 guard) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  page_type text NOT NULL DEFAULT 'page',
  seo_title text,
  meta_description text,
  og_image_url text,
  preview_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.website_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.website_pages(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  label text,
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.website_section_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.website_sections(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  item_type text NOT NULL DEFAULT 'default',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.website_theme (
  id text PRIMARY KEY DEFAULT 'default',
  tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  dark_mode_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.website_theme (id, tokens)
VALUES ('default', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

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

CREATE TABLE IF NOT EXISTS public.media_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_pages_slug_idx ON public.website_pages(slug);
CREATE INDEX IF NOT EXISTS website_sections_page_idx ON public.website_sections(page_id, sort_order);
CREATE INDEX IF NOT EXISTS website_publish_history_page_idx ON public.website_publish_history(page_id, created_at DESC);

SELECT public.pbpp_attach_updated_at('public.website_pages'::regclass);
SELECT public.pbpp_attach_updated_at('public.website_sections'::regclass);
SELECT public.pbpp_attach_updated_at('public.website_theme'::regclass);

-- ── media_assets extensions ──────────────────────────────────────────────────
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS job_reference text,
  ADD COLUMN IF NOT EXISTS collection_id uuid,
  ADD COLUMN IF NOT EXISTS webp_url text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS width int,
  ADD COLUMN IF NOT EXISTS height int;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_collection_id_fkey'
  ) THEN
    ALTER TABLE public.media_assets
      ADD CONSTRAINT media_assets_collection_id_fkey
      FOREIGN KEY (collection_id) REFERENCES public.media_collections(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS media_assets_folder_idx ON public.media_assets(folder_id);
CREATE INDEX IF NOT EXISTS media_assets_created_idx ON public.media_assets(created_at DESC);

-- ── jobs FK hardening (optional columns) ─────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'quote_id')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_quote_id_fkey') THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_quote_id_fkey
      FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'invoice_id')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_invoice_id_fkey') THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_invoice_id_fkey
      FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── Storage buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('lead-media', 'lead-media', true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif']),
  ('signed-documents', 'signed-documents', false, 10485760, ARRAY['image/png','image/jpeg','application/pdf']),
  ('receipts', 'receipts', false, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf']),
  ('job-media', 'job-media', false, 20971520, ARRAY['image/jpeg','image/jpg','image/png','image/webp','video/mp4','video/quicktime']),
  ('cms-media', 'cms-media', true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('media-library', 'media-library', true, 20971520, ARRAY['image/jpeg','image/jpg','image/png','image/webp','video/mp4','video/quicktime'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── RLS: enable on builder + quote_events ────────────────────────────────────
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_theme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_publish_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_website_pages ON public.website_pages;
CREATE POLICY admin_all_website_pages ON public.website_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_website_sections ON public.website_sections;
CREATE POLICY admin_all_website_sections ON public.website_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_website_section_items ON public.website_section_items;
CREATE POLICY admin_all_website_section_items ON public.website_section_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_website_theme ON public.website_theme;
CREATE POLICY admin_all_website_theme ON public.website_theme FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_website_publish_history ON public.website_publish_history;
CREATE POLICY admin_all_website_publish_history ON public.website_publish_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_media_collections ON public.media_collections;
CREATE POLICY admin_all_media_collections ON public.media_collections FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_quote_events ON public.quote_events;
CREATE POLICY admin_all_quote_events ON public.quote_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_quote_events ON public.quote_events;
CREATE POLICY service_role_all_quote_events ON public.quote_events FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_read_published_pages ON public.website_pages;
CREATE POLICY anon_read_published_pages ON public.website_pages FOR SELECT TO anon USING (status = 'published');

-- ── Storage policies ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_storage_all ON storage.objects;
CREATE POLICY admin_storage_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = ANY (ARRAY['receipts','job-media','cms-media','media-library','lead-media','signed-documents']))
  WITH CHECK (bucket_id = ANY (ARRAY['receipts','job-media','cms-media','media-library','lead-media','signed-documents']));

DROP POLICY IF EXISTS service_role_storage_all ON storage.objects;
CREATE POLICY service_role_storage_all ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = ANY (ARRAY['receipts','job-media','cms-media','media-library','lead-media','signed-documents']))
  WITH CHECK (bucket_id = ANY (ARRAY['receipts','job-media','cms-media','media-library','lead-media','signed-documents']));

DROP POLICY IF EXISTS anon_lead_media_insert ON storage.objects;
CREATE POLICY anon_lead_media_insert ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'lead-media');

DROP POLICY IF EXISTS anon_lead_media_select ON storage.objects;
CREATE POLICY anon_lead_media_select ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'lead-media');

COMMIT;
