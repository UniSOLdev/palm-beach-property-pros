-- Admin entity lifecycle: soft delete, archive timestamps, unified activity log

BEGIN;

-- ── Lifecycle columns on core CRM entities ───────────────────────────────────
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients',
    'quote_requests',
    'quotes',
    'invoices',
    'jobs',
    'tasks',
    'expenses'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at timestamptz', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS archived_at timestamptz', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_by uuid', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS archived_by uuid', t);
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (deleted_at) WHERE deleted_at IS NULL',
        t || '_active_idx',
        t
      );
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (archived_at) WHERE archived_at IS NOT NULL',
        t || '_archived_idx',
        t
      );
    END IF;
  END LOOP;
END $$;

-- Backfill archived_at from legacy archived boolean
UPDATE public.clients SET archived_at = COALESCE(created_at, now()) WHERE archived = true AND archived_at IS NULL;
UPDATE public.quote_requests SET archived_at = COALESCE(updated_at, created_at, now()) WHERE archived = true AND archived_at IS NULL;
UPDATE public.quotes SET archived_at = COALESCE(created_at, now()) WHERE archived = true AND archived_at IS NULL;
UPDATE public.invoices SET archived_at = COALESCE(created_at, now()) WHERE archived = true AND archived_at IS NULL;
UPDATE public.jobs SET archived_at = COALESCE(created_at, now()) WHERE archived = true AND archived_at IS NULL;
UPDATE public.tasks SET archived_at = COALESCE(updated_at, created_at, now()) WHERE archived = true AND archived_at IS NULL;
UPDATE public.expenses SET archived_at = COALESCE(updated_at, created_at, now()) WHERE archived = true AND archived_at IS NULL;

-- Keep legacy archived boolean in sync with archived_at
CREATE OR REPLACE FUNCTION public.pbpp_sync_lifecycle_flags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    NEW.archived := (NEW.archived_at IS NOT NULL);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
  trg name;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients',
    'quote_requests',
    'quotes',
    'invoices',
    'jobs',
    'tasks',
    'expenses'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'archived'
    ) THEN
      trg := t || '_lifecycle_sync';
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trg, t);
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF archived_at, deleted_at ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.pbpp_sync_lifecycle_flags()',
        trg,
        t
      );
    END IF;
  END LOOP;
END $$;

-- ── Unified admin activity log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_entity_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_entity_activity_entity_idx
  ON public.admin_entity_activity (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_entity_activity_action_idx
  ON public.admin_entity_activity (action, created_at DESC);

COMMENT ON TABLE public.admin_entity_activity IS
  'Cross-entity admin audit trail for archive, delete, duplicate, status changes';

ALTER TABLE public.admin_entity_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_admin_entity_activity ON public.admin_entity_activity;
CREATE POLICY admin_all_admin_entity_activity ON public.admin_entity_activity
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
