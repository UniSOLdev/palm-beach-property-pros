-- Seed site_services from existing PBPP service catalog with updated window/pressure copy

BEGIN;

-- Ensure single homepage row
DELETE FROM public.site_homepage_settings WHERE id NOT IN (
  SELECT id FROM public.site_homepage_settings ORDER BY updated_at DESC LIMIT 1
);

-- Window Cleaning → Complete Window Detailing (featured, order 1)
INSERT INTO public.site_services (
  slug, title, short_description, headline, authority_intro, best_for,
  included, add_ons, who_its_for, process_steps,
  pricing_mode, pricing_label, display_order, is_featured, is_active, seo_title, seo_description
) VALUES (
  'window-cleaning',
  'Complete Window Detailing',
  'Crystal-clear glass with full detailing—exterior and interior panes, screens, frames, sills, and tracks cleaned with care.',
  'Complete Window Detailing in Palm Beach County',
  'Professional window detailing improves light, appearance, and first impressions. Our crews work methodically on residential and commercial glass throughout Palm Beach County, with scope matched to height, access, and finish type.',
  'Water-view homes, storefronts, offices, and entries with heavy sun and salt exposure.',
  '["Exterior glass cleaning","Interior glass where safely accessible","Screens removed and cleaned","Frames and sills wiped down","Track vacuuming and detailing","Floor and sill protection during service","Finish-safe products for coastal residue"]'::jsonb,
  '["Optional steam detailing for stubborn buildup","Optional hard-water stain treatment"]'::jsonb,
  '["Homeowners who want clarity without ladder risk","Retail and office entrances needing consistent polish","Property managers scheduling recurring glass care"]'::jsonb,
  '["Confirm scope, access, and pane count from your quote request","Protect floors and sills; set up ladders or water-fed poles safely","Clean exterior glass, then interior where included","Detail screens, frames, sills, and tracks per agreed scope","Walkthrough with you and note any follow-up items"]'::jsonb,
  'starting_at',
  'Window detailing projects often start around $99 depending on pane count, height, and access.',
  1, true, true,
  'Complete Window Detailing | Palm Beach County',
  'Complete window detailing—exterior and interior glass, screens, frames, sills, and tracks. Free estimates in Palm Beach County.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_description = EXCLUDED.short_description,
  headline = EXCLUDED.headline,
  authority_intro = EXCLUDED.authority_intro,
  included = EXCLUDED.included,
  add_ons = EXCLUDED.add_ons,
  display_order = EXCLUDED.display_order,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

-- Pressure Washing (featured, order 2)
INSERT INTO public.site_services (
  slug, title, short_description, headline, authority_intro, best_for,
  included, add_ons, who_its_for, process_steps,
  pricing_mode, pricing_label, water_access_note,
  display_order, is_featured, is_active, seo_title, seo_description
) VALUES (
  'pressure-washing',
  'Pressure Washing',
  'Driveways, walkways, patios, pool decks, pavers, fences, exterior surfaces, and screen enclosures—cleaned with surface-appropriate pressure or soft washing.',
  'Pressure Washing & Exterior Cleaning in Palm Beach County',
  'Exterior cleaning is as much about technique as pressure. We evaluate surface hardness, landscaping proximity, and staining type before choosing pressure washing or soft washing—so results look sharp without unnecessary risk.',
  'Homes, HOAs, storefront approaches, and pool decks needing algae or grime removal.',
  '["Driveways and walkways","Patios and pool decks","Pavers and hardscape","Fences and gates","Exterior siding and stucco where appropriate","Screen enclosures by scope","Surface-appropriate pressure or soft washing","Plant-conscious setup and rinsing"]'::jsonb,
  '["Pretreatment for algae and mildew","Additional water arrangement when no spigot is available"]'::jsonb,
  '["Homeowners restoring curb appeal","HOAs maintaining common walks and entries","Retail entries with heavy foot traffic"]'::jsonb,
  '["Review surfaces, stains, and water access from your quote request","Protect landscaping and fragile items near work areas","Apply pretreatment where needed for algae or mildew","Pressure or soft wash matched to each substrate","Final rinse and walkthrough"]'::jsonb,
  'starting_at',
  'Many driveway and walkway refreshes start around $129; full exterior projects are scoped by square footage and height.',
  'PBPP normally connects equipment to your accessible exterior water spigot. Standard water access at the property is expected unless we arrange an alternate setup in advance—additional charges may apply when a tank or alternate water source is required.',
  2, true, true,
  'Pressure Washing | Palm Beach County',
  'Pressure washing for driveways, patios, pool decks, pavers, fences, and screen enclosures. Customer supplies standard exterior water access.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_description = EXCLUDED.short_description,
  headline = EXCLUDED.headline,
  water_access_note = EXCLUDED.water_access_note,
  included = EXCLUDED.included,
  display_order = EXCLUDED.display_order,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

-- Remaining services (not featured by default)
INSERT INTO public.site_services (slug, title, short_description, headline, authority_intro, best_for, included, who_its_for, pricing_mode, pricing_label, display_order, is_active)
VALUES
  ('residential-cleaning', 'Residential Cleaning',
   'A cleaner, calmer home on a schedule that fits—kitchens, baths, floors, and priority rooms handled with consistent standards.',
   'Residential Cleaning in Palm Beach County',
   'Residential cleaning should feel dependable: the same attention to kitchens and baths, floors that look consistently kept, and communication you can count on.',
   'Busy households, seasonal residents, and recurring home maintenance.',
   '["Kitchen and bath sanitizing and wipe-down","Dusting, vacuuming, and hard-surface floor care","Priority rooms you designate each visit","Supplies and equipment suited to your finishes"]'::jsonb,
   '["Single-family homes and estates","Condos and townhomes","Seasonal Palm Beach residents"]'::jsonb,
   'starting_at', 'Standard residential cleaning often starts around $120; deep visits priced by square footage and condition.', 3, true),
  ('commercial-cleaning', 'Commercial Cleaning',
   'Customer-ready floors, restrooms, and touchpoints—commercial cleaning that supports your brand without slowing operations.',
   'Commercial Cleaning in Palm Beach County',
   'Commercial spaces live and die on details: restrooms, glass, floors, and high-touch surfaces.',
   'Retail, offices, showrooms, and light industrial storefronts.',
   '["Restrooms, break areas, and high-touch disinfection by scope","Trash removal and floor care matched to traffic","Glass and entry refresh options","After-hours scheduling when available"]'::jsonb,
   '["Storefronts and boutiques","Professional offices","Dealerships and showrooms"]'::jsonb,
   'custom_estimate', 'Commercial cleaning is quoted by square footage, frequency, and scope.', 4, true),
  ('auto-detailing', 'Auto Detailing',
   'Interior freshness and exterior depth—detailing that protects trim, wheels, and cabin materials.',
   'Auto Detailing in Palm Beach County',
   'Detailing is finish work: wheels, trim, glass, leather, and carpets each need the right chemistry and agitation.',
   'Personal vehicles, weekend cars, and small fleets.',
   '["Exterior wash, wheels, and tire dressing by package","Interior vacuum, wipe-down, and glass","Leather conditioning when selected"]'::jsonb,
   '["Homeowners maintaining high-use vehicles","Dealerships needing consistent lot presentation"]'::jsonb,
   'starting_at', 'Interior–exterior detailing packages often start around $150.', 5, true),
  ('carpet-steam-cleaning', 'Carpet & Steam Cleaning',
   'Hot-water extraction that lifts embedded soil—better air quality and renewed pile.',
   'Carpet & Steam Cleaning in Palm Beach County',
   'Carpet cleaning should improve how a room feels—not just how it looks for a day.',
   'Move-ins, rentals, pet households, and annual refreshes.',
   '["Pre-vacuum and targeted spot treatment","Hot water extraction by fiber and room","Traffic-lane focus options for rentals"]'::jsonb,
   '["Homeowners refreshing bedrooms and living areas","Airbnb hosts between guests"]'::jsonb,
   'starting_at', 'Room-based carpet cleaning often starts around $99.', 6, true),
  ('trash-can-cleaning', 'Trash Can Cleaning',
   'Sanitized bins that cut odors and pests—exterior and interior wash for residential and HOA communities.',
   'Trash Can Cleaning in Palm Beach County',
   'Clean bins reduce odor, pests, and residue buildup between collection days.',
   'HOAs, residential communities, and property managers.',
   '["Exterior and interior bin wash","Deodorizing treatment by scope","Scheduled routes for communities"]'::jsonb,
   '["HOA communities","Property managers","Homeowners with persistent odor issues"]'::jsonb,
   'starting_at', 'Bin cleaning is quoted by number of containers and service frequency.', 7, true),
  ('property-maintenance', 'Property Maintenance',
   'Ongoing property care—seasonal checks, light repairs coordination, and maintenance visits aligned to your calendar.',
   'Property Maintenance in Palm Beach County',
   'Properties need steady attention between seasons: exterior checks, vendor coordination, and documented visits.',
   'Seasonal residents, estates, and property managers.',
   '["Seasonal property checks","Light maintenance coordination","Documented visit reports when requested"]'::jsonb,
   '["Seasonal homeowners","Estate managers","Property management firms"]'::jsonb,
   'custom_estimate', 'Maintenance programs are scoped to property size and visit frequency.', 8, true),
  ('airbnb-services', 'Airbnb / Turnover Services',
   'Check-in aligned turnovers—linen resets, staging details, and cleaning under your SOPs.',
   'Airbnb & Short-Term Rental Services in Palm Beach County',
   'Turnovers must be predictable: cleaning, staging, and communication aligned to your guest calendar.',
   'Short-term rental hosts and co-hosts.',
   '["Turnover cleaning aligned to check-in windows","Linen and staging resets per your SOP","Photo documentation when requested"]'::jsonb,
   '["Airbnb hosts","Vacation rental managers","Co-host partners"]'::jsonb,
   'custom_estimate', 'Turnover pricing reflects unit size, linen handling, and turnaround windows.', 9, true)
ON CONFLICT (slug) DO NOTHING;

-- Window detailing FAQs
INSERT INTO public.site_service_faqs (service_id, question, answer, sort_order)
SELECT s.id, f.question, f.answer, f.sort_order
FROM public.site_services s
CROSS JOIN (VALUES
  ('Do you clean both interior and exterior glass?', 'Yes, when access and safety allow. We confirm height, ladder requirements, and any HOA rules before scheduling.', 1),
  ('What is included in complete window detailing?', 'Exterior and interior glass, screens, frames, sills, and track vacuuming/detailing are included per agreed scope. Steam detailing and hard-water treatment are optional add-ons.', 2),
  ('How often should windows be cleaned in Palm Beach County?', 'Many coastal homes benefit from quarterly exterior service. We recommend a cadence after the first visit based on exposure.', 3),
  ('What is the fastest way to get pricing?', 'Send photos of each elevation and note approximate pane counts through our quote form. We reply with a scope-based estimate.', 4)
) AS f(question, answer, sort_order)
WHERE s.slug = 'window-cleaning'
ON CONFLICT DO NOTHING;

-- Pressure washing FAQs (includes water access FAQ)
INSERT INTO public.site_service_faqs (service_id, question, answer, sort_order)
SELECT s.id, f.question, f.answer, f.sort_order
FROM public.site_services s
CROSS JOIN (VALUES
  ('Does PBPP bring water?', 'Normally we connect to your accessible exterior water spigot. Standard water access at the property is expected unless we arrange an alternate setup in advance. Jobs without spigot access may require alternate water arrangements and an additional charge.', 1),
  ('Will pressure washing damage my siding?', 'Not when matched correctly. We use soft washing on delicate substrates and adjust distance, angle, and detergents to reduce risk.', 2),
  ('Do you pretreat algae and mildew?', 'Yes. Pretreatment is often the difference between a surface that stays clean longer versus one that bounces back in weeks.', 3),
  ('What surfaces do you pressure wash?', 'Driveways, walkways, patios, pool decks, pavers, fences, exterior surfaces, and screen enclosures—scoped to each substrate.', 4),
  ('How should I prepare my property?', 'Close windows, clear fragile items from patios, and confirm an accessible exterior water spigot. Note any access constraints on the quote form.', 5)
) AS f(question, answer, sort_order)
WHERE s.slug = 'pressure-washing'
ON CONFLICT DO NOTHING;

-- Project categories seed (estate cleanup from existing curated media — placeholder until owner adds real projects)
INSERT INTO public.site_projects (
  title, slug, city, service_categories, short_summary, long_description,
  is_published, is_featured, sort_order
) VALUES (
  'Estate Cleanup — Reference Project',
  'estate-cleanup-reference',
  'Palm Beach County',
  ARRAY['estate-cleanup', 'property-maintenance'],
  'Documented estate refresh work—photos from PBPP field operations. Replace with your published case study when ready.',
  'This placeholder project preserves the existing curated media structure. The owner should replace this with a real case study, city, completion date, and client-approved testimonial before publishing.',
  false, false, 0
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
