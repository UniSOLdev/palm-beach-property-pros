-- media_assets extensions for media library pro
CREATE TABLE IF NOT EXISTS public.media_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

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

NOTIFY pgrst, 'reload schema';;
