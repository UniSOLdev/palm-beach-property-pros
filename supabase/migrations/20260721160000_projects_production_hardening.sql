-- Production hardening for DB-first projects (RLS, indexes, constraints)

BEGIN;

-- One portfolio entry per completed job (when linked)
CREATE UNIQUE INDEX IF NOT EXISTS site_projects_source_job_unique_idx
  ON public.site_projects(source_job_id)
  WHERE source_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS site_projects_featured_idx
  ON public.site_projects(is_published, is_featured, sort_order)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS site_projects_updated_at_idx
  ON public.site_projects(updated_at DESC);

CREATE INDEX IF NOT EXISTS site_project_media_asset_idx
  ON public.site_project_media(media_asset_id);

-- Junction table RLS (matches site_cms_upgrade pattern)
ALTER TABLE public.site_project_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_site_project_services ON public.site_project_services;
CREATE POLICY admin_all_site_project_services ON public.site_project_services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_site_project_services ON public.site_project_services;
CREATE POLICY service_role_all_site_project_services ON public.site_project_services
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_read_site_project_services ON public.site_project_services;
CREATE POLICY anon_read_site_project_services ON public.site_project_services
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.site_projects p
      WHERE p.id = project_id AND p.is_published = true
    )
  );

COMMIT;
