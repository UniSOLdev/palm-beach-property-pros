-- Media library persistence: RLS policies, optimization tracking, HEIC support

BEGIN;

-- ── Optimization tracking ─────────────────────────────────────────────────────
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS optimization_status text NOT NULL DEFAULT 'pending'
    CHECK (optimization_status IN ('pending', 'complete', 'failed', 'skipped')),
  ADD COLUMN IF NOT EXISTS optimization_error text;

CREATE INDEX IF NOT EXISTS media_assets_optimization_status_idx
  ON public.media_assets(optimization_status);

-- ── RLS: media_folders + media_assets (enabled but missing policies) ──────────
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_media_folders ON public.media_folders;
CREATE POLICY admin_all_media_folders ON public.media_folders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_media_folders ON public.media_folders;
CREATE POLICY service_role_all_media_folders ON public.media_folders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_media_assets ON public.media_assets;
CREATE POLICY admin_all_media_assets ON public.media_assets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_media_assets ON public.media_assets;
CREATE POLICY service_role_all_media_assets ON public.media_assets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read for published gallery assets (storage URLs are public anyway)
DROP POLICY IF EXISTS anon_read_media_assets ON public.media_assets;
CREATE POLICY anon_read_media_assets ON public.media_assets
  FOR SELECT TO anon USING (true);

-- ── Storage: expand media-library mime types (iPhone HEIC) ───────────────────
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif',
    'video/mp4','video/quicktime'
  ],
  file_size_limit = 20971520
WHERE id = 'media-library';

COMMIT;
