
-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date date,
  assigned_crew_ids uuid[] NOT NULL DEFAULT '{}',
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  recurring_rule text CHECK (recurring_rule IS NULL OR recurring_rule IN ('daily', 'weekly', 'monthly')),
  recurring_parent_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks (due_date) WHERE archived = false;
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status) WHERE archived = false;

-- CMS
CREATE TABLE IF NOT EXISTS public.cms_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  section_key text NOT NULL,
  title text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_key, section_key)
);

CREATE TABLE IF NOT EXISTS public.cms_navigation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.cms_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  title text,
  description text,
  og_image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Media library
CREATE TABLE IF NOT EXISTS public.media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES public.media_folders(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  storage_path text,
  file_type text NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'video')),
  title text,
  tags text[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  before_after_group text,
  before_after_role text CHECK (before_after_role IS NULL OR before_after_role IN ('before', 'after')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Expense + job costing extensions
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS crew_member_id uuid REFERENCES public.crew_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_interval text;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS document_status text NOT NULL DEFAULT 'draft'
    CHECK (document_status IN ('draft', 'sent', 'void'));

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS estimated_labor_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_materials_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fuel_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dump_fee_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS truck_rental_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS equipment_cost numeric NOT NULL DEFAULT 0;

-- Seed media folders
INSERT INTO public.media_folders (slug, name, sort_order) VALUES
  ('estate-refresh', 'Estate Refresh', 1),
  ('pressure-washing', 'Pressure Washing', 2),
  ('landscaping', 'Landscaping', 3),
  ('junk-removal', 'Junk Removal', 4),
  ('interior-cleaning', 'Interior Cleaning', 5),
  ('drone', 'Drone', 6),
  ('reels', 'Reels', 7)
ON CONFLICT (slug) DO NOTHING;

-- RLS policies for authenticated admin (single-tenant ops)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'business_settings','clients','crew_members','crew_payouts','expenses',
    'invoice_items','invoices','jobs','quote_items','quotes',
    'sop_checklists','sop_templates','supplies','tasks',
    'cms_sections','cms_navigation','cms_seo','media_folders','media_assets'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS admin_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY admin_all ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- Public read for shared invoices (by public_id lookup in app layer still uses authenticated for admin)
DROP POLICY IF EXISTS public_invoice_read ON public.invoices;
CREATE POLICY public_invoice_read ON public.invoices
  FOR SELECT TO anon
  USING (archived = false AND document_status IN ('sent', 'draft'));

DROP POLICY IF EXISTS public_invoice_items_read ON public.invoice_items;
CREATE POLICY public_invoice_items_read ON public.invoice_items
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND i.archived = false
    )
  );

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('receipts', 'receipts', false),
  ('job-media', 'job-media', false),
  ('cms-media', 'cms-media', true),
  ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS admin_storage_all ON storage.objects;
CREATE POLICY admin_storage_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id IN ('receipts', 'job-media', 'cms-media', 'media-library'))
  WITH CHECK (bucket_id IN ('receipts', 'job-media', 'cms-media', 'media-library'));

DROP POLICY IF EXISTS public_cms_media_read ON storage.objects;
CREATE POLICY public_cms_media_read ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id IN ('cms-media', 'media-library'));
;
