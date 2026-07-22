
CREATE TABLE IF NOT EXISTS public.job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('before', 'after', 'receipt', 'general')),
  storage_path text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_photos_job_id_idx ON public.job_photos (job_id);

ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all ON public.job_photos;
CREATE POLICY admin_all ON public.job_photos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
;
