-- Quote request intake pipeline (public form → admin leads)

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  service_requested text NOT NULL,
  address text NOT NULL,
  city text,
  property_type text,
  message text,
  preferred_contact text DEFAULT 'Call',
  preferred_date date,
  preferred_time text,
  photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'website',
  referrer text,
  status text NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'quoted', 'scheduled', 'won', 'lost')
  ),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  internal_notes text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS quote_requests_created_idx ON public.quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_archived_idx ON public.quote_requests(archived) WHERE archived = false;

CREATE TABLE IF NOT EXISTS public.quote_request_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (
    activity_type IN ('note', 'status_change', 'contact', 'converted', 'system')
  ),
  body text,
  metadata jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_request_activity_lead_idx
  ON public.quote_request_activity(quote_request_id, created_at DESC);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_request_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_quote_requests ON public.quote_requests;
CREATE POLICY admin_all_quote_requests ON public.quote_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_quote_request_activity ON public.quote_request_activity;
CREATE POLICY admin_all_quote_request_activity ON public.quote_request_activity
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage bucket for optional lead photos (server-side uploads via service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lead-media',
  'lead-media',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS admin_read_lead_media ON storage.objects;
CREATE POLICY admin_read_lead_media ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'lead-media');

DROP POLICY IF EXISTS admin_write_lead_media ON storage.objects;
CREATE POLICY admin_write_lead_media ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'lead-media')
  WITH CHECK (bucket_id = 'lead-media');
