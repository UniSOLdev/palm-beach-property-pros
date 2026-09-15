-- B2B outreach prospects: landlords, property managers, STR operators

CREATE TABLE IF NOT EXISTS public.outreach_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_key text UNIQUE,
  company_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  website text,
  prospect_type text NOT NULL DEFAULT 'property_manager'
    CHECK (prospect_type IN ('property_manager', 'str_manager', 'landlord', 'hoa', 'commercial')),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'callback', 'meeting', 'vendor_approved', 'won', 'lost')),
  address text,
  zip text,
  pitch_notes text,
  internal_notes text,
  next_follow_up date,
  sort_order int NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outreach_prospects_type_idx ON public.outreach_prospects(prospect_type, status);
CREATE INDEX IF NOT EXISTS outreach_prospects_follow_up_idx ON public.outreach_prospects(next_follow_up)
  WHERE next_follow_up IS NOT NULL AND archived = false;

ALTER TABLE public.outreach_prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_outreach_prospects ON public.outreach_prospects;
CREATE POLICY admin_all_outreach_prospects ON public.outreach_prospects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS outreach_prospects_updated_at ON public.outreach_prospects;
CREATE TRIGGER outreach_prospects_updated_at
  BEFORE UPDATE ON public.outreach_prospects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.outreach_prospects (
  seed_key, company_name, contact_name, phone, email, website, prospect_type,
  address, zip, pitch_notes, sort_order
) VALUES
  (
    'pmi-west-palm',
    'PMI West Palm',
    'Operations',
    '561-469-0006',
    'officesupport@westpalmpmi.com',
    'https://www.westpalmbeach-propertymanagement.com/',
    'property_manager',
    '311 Golf Rd Ste 1000',
    '33407',
    'Subcontract: turnover cleans, bi-weekly yard, pressure wash. Same zip as Riverstone.',
    10
  ),
  (
    'rpm-sunstate-pbc',
    'RPM Sunstate (Palm Beach County)',
    NULL,
    '561-252-7363',
    NULL,
    'https://www.rpmsunstate.com/',
    'property_manager',
    '5730 Corporate Way Ste 120',
    '33407',
    'Vendor for exterior maintenance + move-out cleans on rental portfolio.',
    20
  ),
  (
    'affiliated-property-services',
    'Affiliated Property Services',
    NULL,
    '561-725-4921',
    'office@managewithaps.com',
    'https://www.managewithaps.com/',
    'property_manager',
    '4512 N Flagler Dr #206',
    '33407',
    'Multifamily — pressure wash entries, glass, grounds touch-up.',
    30
  ),
  (
    'sgk-property-management',
    'SGK Property Management',
    'Andrea Serraes',
    '561-848-6656',
    NULL,
    NULL,
    'property_manager',
    '1243 52nd St Unit 3',
    '33407',
    'Small PM (1–4 staff) — easy vendor onboarding for yard + turnover.',
    40
  ),
  (
    'ibero-property-management',
    'Ibero Property Management',
    NULL,
    '561-420-0640',
    NULL,
    'https://iberopropertymgmt.com/',
    'property_manager',
    NULL,
    '334xx',
    'SFH, condos, villas — full exterior maintenance vendor pitch.',
    50
  ),
  (
    'villavana-str',
    'VILLAVANA Vacation Rentals',
    NULL,
    NULL,
    NULL,
    'https://www.villavanamanagement.com/',
    'str_manager',
    NULL,
    '334xx',
    'Turnover clean + between-guest yard touch. Full-service STR mgmt.',
    60
  ),
  (
    'blue-coast-str',
    'Blue Coast Property Management (STR)',
    NULL,
    NULL,
    NULL,
    'https://bluecoastmanage.com/',
    'str_manager',
    NULL,
    '33410',
    'Turnover vendor — cleans, maintenance coordination, photo docs.',
    70
  ),
  (
    'five-star-properties-str',
    'Five Star Properties (Airbnb PBG)',
    NULL,
    NULL,
    NULL,
    'https://fivestarpropertiesfl.com/',
    'str_manager',
    NULL,
    '33410',
    'Airbnb turnover + pre-guest exterior refresh.',
    80
  ),
  (
    'palm-beach-estate-management',
    'Palm Beach Estate Management (PPM)',
    NULL,
    NULL,
    NULL,
    'https://palmbeachcountypropertymanagement.com/',
    'str_manager',
    '5220 Hood Rd Ste 110',
    '33418',
    'STR maintenance vendor — cleans, glass, pool deck pressure wash.',
    90
  ),
  (
    'digsify-str',
    'Digsify (STR)',
    NULL,
    NULL,
    NULL,
    'https://go.digsify.com/',
    'str_manager',
    '9903 Fuschia Cir S',
    '33410',
    'Per-unit turnover pricing — local crew, fast turnaround.',
    100
  ),
  (
    'grs-spencer-lakes-hoa',
    'GRS — Spencer Lakes / Villages POA',
    'Resident Services',
    '561-641-8554',
    NULL,
    'https://www.grsmgt.com/association/spencer-lakes/',
    'hoa',
    NULL,
    '33407',
    'Ask vendor application for pressure wash + grounds (HOA requires driveway wash).',
    110
  )
ON CONFLICT (seed_key) DO NOTHING;
