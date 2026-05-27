-- Site Builder CMS v2: structured projects, strict transformation pairing, modular content entities

BEGIN;

-- ── Projects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  location text,
  category text,
  summary text,
  featured boolean NOT NULL DEFAULT false,
  turnaround_time text,
  hero_media_id uuid,
  walkthrough_media_id uuid,
  service_tags text[] NOT NULL DEFAULT '{}'::text[],
  scope_handled text[] NOT NULL DEFAULT '{}'::text[],
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  archived_at timestamptz,
  deleted_by uuid,
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_featured_idx ON public.projects (featured, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS projects_active_idx ON public.projects (deleted_at) WHERE deleted_at IS NULL;

-- ── Transformations (named story units on a project) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.transformations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  archived_at timestamptz,
  deleted_by uuid,
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transformations_project_idx ON public.transformations (project_id, sort_order);

-- ── Strict transformation pairs (manual before/during/after assignment) ───────
CREATE TABLE IF NOT EXISTS public.transformation_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  transformation_id uuid REFERENCES public.transformations(id) ON DELETE SET NULL,
  title text,
  label text,
  before_media_id uuid,
  during_media_id uuid,
  after_media_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  archived_at timestamptz,
  deleted_by uuid,
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transformation_pairs_before_after_distinct CHECK (
    before_media_id IS NULL OR after_media_id IS NULL OR before_media_id <> after_media_id
  )
);

CREATE INDEX IF NOT EXISTS transformation_pairs_project_idx ON public.transformation_pairs (project_id, sort_order);
CREATE INDEX IF NOT EXISTS transformation_pairs_transformation_idx ON public.transformation_pairs (transformation_id, sort_order);

-- ── Extend media_assets for project + role taxonomy ───────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media_assets') THEN
    ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
    ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';
    ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS media_category text;
    ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS thumbnail_url text;
    CREATE INDEX IF NOT EXISTS media_assets_project_idx ON public.media_assets (project_id, media_category);
  END IF;
END $$;

-- ── Service programs (recurring estate programs) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  eyebrow text,
  title text NOT NULL,
  body text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  archived_at timestamptz,
  deleted_by uuid,
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Workflow steps (field execution timeline) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  detail text,
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  archived_at timestamptz,
  deleted_by uuid,
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Documentation features ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documentation_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  archived_at timestamptz,
  deleted_by uuid,
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Lifecycle sync triggers ───────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects', 'transformations', 'transformation_pairs', 'service_programs', 'workflow_steps', 'documentation_features']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'pbpp_sync_lifecycle_flags') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_lifecycle_sync', t);
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF archived_at, deleted_at ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.pbpp_sync_lifecycle_flags()',
        t || '_lifecycle_sync', t
      );
    END IF;
  END LOOP;
END $$;

-- ── RLS (authenticated admin) ─────────────────────────────────────────────────
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformation_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_features ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects', 'transformations', 'transformation_pairs', 'service_programs', 'workflow_steps', 'documentation_features']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS admin_all_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY admin_all_%I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;

-- ── Seed default structured content (idempotent) ──────────────────────────────
INSERT INTO public.service_programs (slug, eyebrow, title, body, icon, sort_order, featured)
VALUES
  ('weekly-estate-care', 'Weekly rhythm', 'Weekly estate care', 'High-touch residences and active storefronts on a steady operational baseline year-round.', 'calendar', 1, true),
  ('seasonal-programs', 'Seasonal playbook', 'Seasonal property programs', 'Open, close, and peak-season sequences for coastal estates and second homes.', 'palm', 2, true),
  ('vacation-home', 'Owner-offsite coverage', 'Vacation home coordination', 'Coordinated visits while you are away—glass, exterior, interior, and arrival readiness.', 'estate', 3, true),
  ('str-turnovers', 'Per turnover', 'Short-term rental turnovers', 'Check-in aligned crews, linen resets, and staging details under your SOPs.', 'key', 4, true),
  ('storefront', 'Commercial cadence', 'Storefront maintenance', 'Glass, floors, and high-traffic zones matched to operating hours and foot traffic.', 'storefront', 5, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.workflow_steps (slug, label, detail, sort_order)
VALUES
  ('scope-review', 'Scope review', 'Written scope, access notes, and substrates confirmed before dispatch.', 1),
  ('crew-dispatch', 'Crew dispatch', 'Licensed crews scheduled with materials and site-specific checkpoints.', 2),
  ('field-execution', 'Field execution', 'Documented on-site work with photo checkpoints and progress notes.', 3),
  ('quality-walkthrough', 'Quality walkthrough', 'Final walkthrough, punch-list resolution, and client sign-off when required.', 4),
  ('records-delivery', 'Records delivery', 'Visit logs, photos, and operational records delivered to your portal.', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.documentation_features (slug, title, description, icon, sort_order)
VALUES
  ('photo-checklists', 'Photo checklists', 'Before, during, and after documentation for every visit.', 'photos', 1),
  ('visit-logs', 'Visit logs', 'Timestamped field notes tied to your property record.', 'log', 2),
  ('scope-reports', 'Scope reports', 'Written scope and change documentation for stakeholders.', 'report', 3),
  ('client-portal', 'Client portal', 'Quotes, scheduling, invoices, and approvals in one place.', 'portal', 4)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
