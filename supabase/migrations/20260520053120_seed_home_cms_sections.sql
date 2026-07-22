INSERT INTO public.cms_sections (page_key, section_key, title, content, sort_order) VALUES
('home', 'hero', 'Hero', '{"headline":"Palm Beach County Property Care — Done Right.","subheadline":"Premium window cleaning, pressure washing, detailing, and property maintenance trusted by homeowners and businesses across Palm Beach County.","trust_bullets":["Licensed & Insured","Local Palm Beach County Team","Written Scope Confirmation Before Service"]}'::jsonb, 1),
('home', 'trust_band', 'Trust band', '{"cities":["West Palm Beach","Palm Beach Gardens","Jupiter","Delray Beach","Boynton Beach","North Palm Beach","Juno Beach"],"items":[{"icon":"⭐","label":"5-Star Local Service"},{"icon":"📷","label":"Photo-Based Estimates"},{"icon":"🛡","label":"Surface-Safe Methods"}]}'::jsonb, 2),
('home', 'results_gallery', 'Results gallery', '{"items":[]}'::jsonb, 3)
ON CONFLICT (page_key, section_key) DO NOTHING;;
