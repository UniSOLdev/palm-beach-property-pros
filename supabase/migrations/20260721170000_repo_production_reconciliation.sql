-- Forward-only reconciliation: gaps between production-applied migrations and repo-only
-- hand-timestamp files removed during migration history alignment (Jul 2026).
-- Idempotent — safe on production and fresh installs after canonical migrations + CMS batch.

BEGIN;

-- ── Media library optimization tracking (app: media-library.ts, media-library-pro.tsx) ──
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS optimization_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS optimization_error text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_optimization_status_check'
  ) THEN
    ALTER TABLE public.media_assets
      ADD CONSTRAINT media_assets_optimization_status_check
      CHECK (optimization_status IN ('pending', 'complete', 'failed', 'skipped'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS media_assets_optimization_status_idx
  ON public.media_assets(optimization_status);

-- ── Media RLS supplements (production has admin_all from 20260520052729) ───────
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_media_folders ON public.media_folders;
CREATE POLICY service_role_all_media_folders ON public.media_folders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_media_assets ON public.media_assets;
CREATE POLICY service_role_all_media_assets ON public.media_assets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_read_media_assets ON public.media_assets;
CREATE POLICY anon_read_media_assets ON public.media_assets
  FOR SELECT TO anon USING (true);

-- media_collections created in 20260524080235 without RLS policies
ALTER TABLE public.media_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_media_collections ON public.media_collections;
CREATE POLICY admin_all_media_collections ON public.media_collections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_media_collections ON public.media_collections;
CREATE POLICY service_role_all_media_collections ON public.media_collections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Jobs ↔ quotes/invoices FK hardening ───────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'quote_id'
  ) AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_quote_id_fkey') THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_quote_id_fkey
      FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'invoice_id'
  ) AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_invoice_id_fkey') THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_invoice_id_fkey
      FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── Storage MIME expansion (iPhone HEIC for lead + library buckets) ──────────
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif'
]
WHERE id = 'lead-media'
  AND NOT ('image/heic' = ANY(COALESCE(allowed_mime_types, ARRAY[]::text[])));

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif',
    'video/mp4','video/quicktime'
  ],
  file_size_limit = GREATEST(COALESCE(file_size_limit, 0), 20971520)
WHERE id = 'media-library';

COMMIT;
