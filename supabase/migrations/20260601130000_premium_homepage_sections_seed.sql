-- Seed premium modular homepage sections for Site Studio home page

BEGIN;

DO $$
DECLARE
  home_id uuid;
BEGIN
  SELECT id INTO home_id FROM public.website_pages WHERE slug = 'home' LIMIT 1;
  IF home_id IS NULL THEN
    RETURN;
  END IF;

  -- Replace legacy generic stack when home still uses old section types only
  IF EXISTS (
    SELECT 1 FROM public.website_sections
    WHERE page_id = home_id
      AND section_type IN ('services', 'testimonials', 'gallery')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.website_sections
    WHERE page_id = home_id AND section_type = 'transformation_proof'
  ) THEN
    DELETE FROM public.website_sections WHERE page_id = home_id;

    INSERT INTO public.website_sections (page_id, section_type, label, sort_order, is_visible, content)
    VALUES
      (home_id, 'hero_v2', 'Premium Hero', 0, true, '{"eyebrow":"Palm Beach Property Operations","headline":"Property operations for Palm Beach County estates","subheadline":"Recurring estate support, turnovers, and field programs—coordinated with professional crews, documented execution, and modern client systems.","chips":["Licensed & insured","Palm Beach County operations","Documented field execution","Estate & turnover programs"],"primaryCta":{"label":"Request a scope review","href":"/quote"},"useCuratedHero":true}'::jsonb),
      (home_id, 'transformation_proof', 'Transformation Proof', 1, true, '{"source":"database","featuredOnly":true}'::jsonb),
      (home_id, 'additional_proof', 'Additional Proof', 2, true, '{"source":"database"}'::jsonb),
      (home_id, 'transformation_arc', 'Transformation Arc', 3, true, '{"useCuratedStoryArc":true}'::jsonb),
      (home_id, 'recurring_programs', 'Recurring Programs', 4, true, '{"source":"database"}'::jsonb),
      (home_id, 'service_divisions', 'Service Divisions', 5, true, '{}'::jsonb),
      (home_id, 'project_recap', 'Project Recaps', 6, true, '{"source":"database","featuredOnly":true}'::jsonb),
      (home_id, 'who_we_serve', 'Who We Serve', 7, true, '{}'::jsonb),
      (home_id, 'operational_credibility', 'Operational Credibility', 8, true, '{}'::jsonb),
      (home_id, 'local_presence', 'Local Presence', 9, true, '{}'::jsonb),
      (home_id, 'workflow', 'Workflow', 10, true, '{"source":"database"}'::jsonb),
      (home_id, 'documentation_systems', 'Documentation Systems', 11, true, '{"source":"database"}'::jsonb),
      (home_id, 'faq', 'FAQ', 12, true, '{"useSiteFaq":true}'::jsonb),
      (home_id, 'cta_v2', 'Premium CTA', 13, true, '{"showPhone":true}'::jsonb);
  END IF;
END $$;

COMMIT;
