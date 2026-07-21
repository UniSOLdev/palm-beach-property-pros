-- Projects DB-first: entity relationships for CMS + LINKR foundation

BEGIN;

ALTER TABLE public.site_projects
  ADD COLUMN IF NOT EXISTS source_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS legacy_filesystem_id text;

CREATE UNIQUE INDEX IF NOT EXISTS site_projects_legacy_filesystem_id_idx
  ON public.site_projects(legacy_filesystem_id)
  WHERE legacy_filesystem_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS site_projects_source_job_idx ON public.site_projects(source_job_id);
CREATE INDEX IF NOT EXISTS site_projects_client_idx ON public.site_projects(client_id);

CREATE TABLE IF NOT EXISTS public.site_project_services (
  project_id uuid NOT NULL REFERENCES public.site_projects(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.site_services(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, service_id)
);

CREATE INDEX IF NOT EXISTS site_project_services_service_idx
  ON public.site_project_services(service_id);

-- Public read of project media when parent project is published
DROP POLICY IF EXISTS anon_read_site_project_media ON public.site_project_media;
CREATE POLICY anon_read_site_project_media ON public.site_project_media
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.site_projects p
      WHERE p.id = project_id AND p.is_published = true
    )
  );

COMMIT;
