-- PBPP Receipt asset normalization + retroactive migration
BEGIN;

-- ── expenses: standardized receipt asset columns ─────────────────────────────
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS receipt_original_path text,
  ADD COLUMN IF NOT EXISTS receipt_optimized_path text,
  ADD COLUMN IF NOT EXISTS receipt_thumbnail_path text,
  ADD COLUMN IF NOT EXISTS receipt_processing_status text
    CHECK (
      receipt_processing_status IS NULL
      OR receipt_processing_status IN (
        'queued', 'converting', 'optimizing', 'scanning', 'completed', 'failed'
      )
    ),
  ADD COLUMN IF NOT EXISTS receipt_processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_processing_error text;

CREATE INDEX IF NOT EXISTS expenses_receipt_processing_status_idx
  ON public.expenses (receipt_processing_status)
  WHERE receipt_processing_status IS NOT NULL;

-- Backfill paths from legacy columns where possible
UPDATE public.expenses
SET receipt_original_path = receipt_storage_path
WHERE receipt_storage_path IS NOT NULL AND receipt_original_path IS NULL;

-- ── expense_receipts: same asset columns ─────────────────────────────────────
ALTER TABLE public.expense_receipts
  ADD COLUMN IF NOT EXISTS receipt_original_path text,
  ADD COLUMN IF NOT EXISTS receipt_optimized_path text,
  ADD COLUMN IF NOT EXISTS receipt_thumbnail_path text,
  ADD COLUMN IF NOT EXISTS receipt_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS receipt_processing_status text
    CHECK (
      receipt_processing_status IS NULL
      OR receipt_processing_status IN (
        'queued', 'converting', 'optimizing', 'scanning', 'completed', 'failed'
      )
    ),
  ADD COLUMN IF NOT EXISTS receipt_processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_processing_error text,
  ADD COLUMN IF NOT EXISTS normalized_paths jsonb DEFAULT '[]'::jsonb;

UPDATE public.expense_receipts
SET
  receipt_original_path = COALESCE(receipt_original_path, receipt_storage_path),
  receipt_optimized_path = COALESCE(receipt_optimized_path, optimized_storage_path)
WHERE receipt_storage_path IS NOT NULL AND receipt_original_path IS NULL;

-- ── migration run + queue ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.receipt_migration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'running', 'paused', 'completed', 'failed')),
  paused boolean NOT NULL DEFAULT false,
  total_count integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  processing_count integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_batch_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.receipt_migration_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.receipt_migration_runs(id) ON DELETE CASCADE,
  source_bucket text NOT NULL,
  source_path text NOT NULL,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  expense_receipt_id uuid REFERENCES public.expense_receipts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'skipped')),
  target_original_path text,
  target_optimized_path text,
  target_thumbnail_path text,
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  log_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, source_bucket, source_path)
);

CREATE INDEX IF NOT EXISTS receipt_migration_items_run_status_idx
  ON public.receipt_migration_items (run_id, status);

CREATE TABLE IF NOT EXISTS public.receipt_migration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.receipt_migration_runs(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.receipt_migration_items(id) ON DELETE SET NULL,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  message text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receipt_migration_logs_run_created_idx
  ON public.receipt_migration_logs (run_id, created_at DESC);

ALTER TABLE public.receipt_migration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_migration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_migration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_receipt_migration_runs ON public.receipt_migration_runs;
CREATE POLICY admin_all_receipt_migration_runs ON public.receipt_migration_runs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_receipt_migration_items ON public.receipt_migration_items;
CREATE POLICY admin_all_receipt_migration_items ON public.receipt_migration_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_receipt_migration_logs ON public.receipt_migration_logs;
CREATE POLICY admin_all_receipt_migration_logs ON public.receipt_migration_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Storage buckets (new architecture) ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'receipts-original',
    'receipts-original',
    false,
    15728640,
    ARRAY[
      'image/jpeg','image/jpg','image/png','image/webp',
      'image/heic','image/heif','application/pdf'
    ]
  ),
  (
    'receipts-optimized',
    'receipts-optimized',
    false,
    10485760,
    ARRAY['image/jpeg','image/jpg']
  ),
  (
    'receipts-thumbnails',
    'receipts-thumbnails',
    false,
    2097152,
    ARRAY['image/jpeg','image/jpg']
  ),
  (
    'receipts-debug',
    'receipts-debug',
    false,
    10485760,
    ARRAY['image/jpeg','image/jpg','image/png','application/json']
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Extend storage RLS for new receipt buckets (keep legacy receipts buckets)
DROP POLICY IF EXISTS admin_storage_all ON storage.objects;
CREATE POLICY admin_storage_all ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = ANY (
      ARRAY[
        'receipts','receipts-optimized',
        'receipts-original','receipts-thumbnails','receipts-debug',
        'job-media','cms-media','media-library','lead-media','signed-documents'
      ]
    )
  )
  WITH CHECK (
    bucket_id = ANY (
      ARRAY[
        'receipts','receipts-optimized',
        'receipts-original','receipts-thumbnails','receipts-debug',
        'job-media','cms-media','media-library','lead-media','signed-documents'
      ]
    )
  );

DROP POLICY IF EXISTS service_role_storage_all ON storage.objects;
CREATE POLICY service_role_storage_all ON storage.objects
  FOR ALL TO service_role
  USING (
    bucket_id = ANY (
      ARRAY[
        'receipts','receipts-optimized',
        'receipts-original','receipts-thumbnails','receipts-debug',
        'job-media','cms-media','media-library','lead-media','signed-documents'
      ]
    )
  )
  WITH CHECK (
    bucket_id = ANY (
      ARRAY[
        'receipts','receipts-optimized',
        'receipts-original','receipts-thumbnails','receipts-debug',
        'job-media','cms-media','media-library','lead-media','signed-documents'
      ]
    )
  );

COMMIT;
