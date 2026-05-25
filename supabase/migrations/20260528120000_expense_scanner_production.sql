-- PBPP Expenses + Receipt Scanner production hardening
BEGIN;

-- ── expenses: scan metadata + timestamps ─────────────────────────────────────
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS receipt_storage_path text,
  ADD COLUMN IF NOT EXISTS optimized_image_url text,
  ADD COLUMN IF NOT EXISTS scan_status text CHECK (scan_status IS NULL OR scan_status IN ('pending', 'scanned', 'partial', 'failed', 'manual')),
  ADD COLUMN IF NOT EXISTS scan_confidence numeric(4,3),
  ADD COLUMN IF NOT EXISTS scan_raw_response jsonb,
  ADD COLUMN IF NOT EXISTS ocr_version text;

CREATE INDEX IF NOT EXISTS expenses_expense_date_idx ON public.expenses (expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON public.expenses (category);
CREATE INDEX IF NOT EXISTS expenses_job_id_idx ON public.expenses (job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS expenses_vendor_idx ON public.expenses (vendor);
CREATE INDEX IF NOT EXISTS expenses_reimbursable_idx ON public.expenses (reimbursable) WHERE reimbursable = true;

-- ── expense_receipts: draft + linked receipt records ─────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'linked', 'archived')),
  vendor text,
  expense_date date,
  amount numeric(12,2),
  subtotal numeric(12,2),
  tax numeric(12,2),
  category text,
  payment_method text,
  card_last4 text,
  receipt_number text,
  suggested_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  receipt_storage_path text NOT NULL,
  optimized_storage_path text,
  receipt_url text,
  optimized_image_url text,
  scan_status text CHECK (scan_status IS NULL OR scan_status IN ('pending', 'scanned', 'partial', 'failed', 'manual')),
  scan_confidence numeric(4,3),
  scan_raw_response jsonb,
  ocr_version text,
  line_items jsonb DEFAULT '[]'::jsonb,
  warnings text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expense_receipts_expense_id_idx ON public.expense_receipts (expense_id);
CREATE INDEX IF NOT EXISTS expense_receipts_status_idx ON public.expense_receipts (status);
CREATE INDEX IF NOT EXISTS expense_receipts_created_at_idx ON public.expense_receipts (created_at DESC);

ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_expense_receipts ON public.expense_receipts;
CREATE POLICY admin_all_expense_receipts ON public.expense_receipts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── expense_scan_logs: audit trail ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid REFERENCES public.expense_receipts(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  original_mime text,
  original_size_bytes bigint,
  optimized_size_bytes bigint,
  scan_status text NOT NULL DEFAULT 'started',
  scan_confidence numeric(4,3),
  ocr_version text,
  model text,
  duration_ms integer,
  error_message text,
  raw_response jsonb,
  warnings text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expense_scan_logs_created_at_idx ON public.expense_scan_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS expense_scan_logs_receipt_id_idx ON public.expense_scan_logs (receipt_id);

ALTER TABLE public.expense_scan_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_expense_scan_logs ON public.expense_scan_logs;
CREATE POLICY admin_all_expense_scan_logs ON public.expense_scan_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Storage: receipts HEIC + optimized bucket ──────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('receipts-optimized', 'receipts-optimized', false, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif','application/pdf']
WHERE id = 'receipts';

DROP POLICY IF EXISTS admin_storage_all ON storage.objects;
CREATE POLICY admin_storage_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = ANY (ARRAY['receipts','receipts-optimized','job-media','cms-media','media-library','lead-media','signed-documents']))
  WITH CHECK (bucket_id = ANY (ARRAY['receipts','receipts-optimized','job-media','cms-media','media-library','lead-media','signed-documents']));

DROP POLICY IF EXISTS service_role_storage_all ON storage.objects;
CREATE POLICY service_role_storage_all ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = ANY (ARRAY['receipts','receipts-optimized','job-media','cms-media','media-library','lead-media','signed-documents']))
  WITH CHECK (bucket_id = ANY (ARRAY['receipts','receipts-optimized','job-media','cms-media','media-library','lead-media','signed-documents']));

COMMIT;
