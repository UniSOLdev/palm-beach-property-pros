-- Quote intake production repair
-- Fixes legacy quote_requests schema (full_name/service/property_address/photos[])
-- and completes RLS, RPC, storage, triggers for /quote → /admin/leads pipeline.
-- Safe: drops empty legacy tables only (0 rows at time of authoring).

-- ── Drop legacy policies + tables ──────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Allow authenticated users full access to quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Allow public quote submissions" ON public.quote_requests;
DROP POLICY IF EXISTS "Anyone can create quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS admin_all_quote_requests ON public.quote_requests;
DROP POLICY IF EXISTS quote_requests_anon_insert ON public.quote_requests;

DROP POLICY IF EXISTS "Allow authenticated users full access to quote request activity" ON public.quote_request_activity;
DROP POLICY IF EXISTS admin_all_quote_request_activity ON public.quote_request_activity;
DROP POLICY IF EXISTS quote_request_activity_anon_insert ON public.quote_request_activity;

DROP TABLE IF EXISTS public.quote_request_activity CASCADE;
DROP TABLE IF EXISTS public.quote_requests CASCADE;

-- ── Core tables ────────────────────────────────────────────────────────────
CREATE TABLE public.quote_requests (
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

CREATE INDEX quote_requests_status_idx ON public.quote_requests(status);
CREATE INDEX quote_requests_created_idx ON public.quote_requests(created_at DESC);
CREATE INDEX quote_requests_archived_idx ON public.quote_requests(archived) WHERE archived = false;

CREATE TABLE public.quote_request_activity (
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

CREATE INDEX quote_request_activity_lead_idx
  ON public.quote_request_activity(quote_request_id, created_at DESC);

-- ── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_updated_at ON public.quote_requests;
CREATE TRIGGER quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── Activity log on submission ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.quote_request_log_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.quote_request_activity (quote_request_id, activity_type, body)
  VALUES (NEW.id, 'system', 'Quote request submitted from website');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_log_submission ON public.quote_requests;
CREATE TRIGGER quote_requests_log_submission
  AFTER INSERT ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.quote_request_log_submission();

-- ── RLS: quote_requests + activity ───────────────────────────────────────────
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_request_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_quote_requests ON public.quote_requests;
CREATE POLICY admin_all_quote_requests ON public.quote_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS quote_requests_anon_insert ON public.quote_requests;
CREATE POLICY quote_requests_anon_insert ON public.quote_requests
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_quote_request_activity ON public.quote_request_activity;
CREATE POLICY admin_all_quote_request_activity ON public.quote_request_activity
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Public quote share RLS (for /view/quote links) ───────────────────────────
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotes_anon_select ON public.quotes;
CREATE POLICY quotes_anon_select ON public.quotes
  FOR SELECT TO anon
  USING (archived = false);

DROP POLICY IF EXISTS quote_items_anon_select ON public.quote_items;
CREATE POLICY quote_items_anon_select ON public.quote_items
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_items.quote_id AND q.archived = false
    )
  );

DROP POLICY IF EXISTS clients_anon_select_shared ON public.clients;
CREATE POLICY clients_anon_select_shared ON public.clients
  FOR SELECT TO anon
  USING (
    archived = false
    AND (
      EXISTS (
        SELECT 1 FROM public.quotes q
        WHERE q.client_id = clients.id AND q.archived = false
      )
      OR EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.client_id = clients.id AND i.archived = false
      )
    )
  );

DROP POLICY IF EXISTS admin_all_quotes ON public.quotes;
CREATE POLICY admin_all_quotes ON public.quotes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_quote_items ON public.quote_items;
CREATE POLICY admin_all_quote_items ON public.quote_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Public submit RPC (works without service role) ───────────────────────────
CREATE OR REPLACE FUNCTION public.submit_public_quote_request(
  p_name text,
  p_phone text,
  p_email text,
  p_service_requested text,
  p_address text,
  p_city text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_preferred_contact text DEFAULT 'Call',
  p_preferred_date date DEFAULT NULL,
  p_preferred_time text DEFAULT NULL,
  p_source text DEFAULT 'website',
  p_referrer text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_name IS NULL OR trim(p_name) = '' THEN RAISE EXCEPTION 'name is required'; END IF;
  IF p_phone IS NULL OR trim(p_phone) = '' THEN RAISE EXCEPTION 'phone is required'; END IF;
  IF p_service_requested IS NULL OR trim(p_service_requested) = '' THEN RAISE EXCEPTION 'service is required'; END IF;
  IF p_address IS NULL OR trim(p_address) = '' THEN RAISE EXCEPTION 'address is required'; END IF;

  INSERT INTO public.quote_requests (
    name, phone, email, service_requested, address, city, property_type, message,
    preferred_contact, preferred_date, preferred_time, source, referrer, status, photo_urls
  ) VALUES (
    trim(p_name), trim(p_phone), NULLIF(trim(coalesce(p_email, '')), ''),
    trim(p_service_requested), trim(p_address),
    NULLIF(trim(coalesce(p_city, '')), ''), NULLIF(trim(coalesce(p_property_type, '')), ''),
    NULLIF(trim(coalesce(p_message, '')), ''),
    COALESCE(NULLIF(trim(coalesce(p_preferred_contact, '')), ''), 'Call'),
    p_preferred_date, NULLIF(trim(coalesce(p_preferred_time, '')), ''),
    COALESCE(NULLIF(trim(coalesce(p_source, '')), ''), 'website'),
    NULLIF(trim(coalesce(p_referrer, '')), ''), 'new', '[]'::jsonb
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_quote_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_quote_request TO anon, authenticated, service_role;

-- ── Storage: lead-media bucket (public read for admin + direct URLs) ─────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lead-media',
  'lead-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS admin_read_lead_media ON storage.objects;
CREATE POLICY admin_read_lead_media ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'lead-media');

DROP POLICY IF EXISTS admin_write_lead_media ON storage.objects;
CREATE POLICY admin_write_lead_media ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'lead-media')
  WITH CHECK (bucket_id = 'lead-media');

DROP POLICY IF EXISTS public_read_lead_media ON storage.objects;
CREATE POLICY public_read_lead_media ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'lead-media');

DROP POLICY IF EXISTS service_role_lead_media ON storage.objects;
CREATE POLICY service_role_lead_media ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'lead-media')
  WITH CHECK (bucket_id = 'lead-media');

-- Extend admin storage policy to include lead-media
DROP POLICY IF EXISTS admin_storage_all ON storage.objects;
CREATE POLICY admin_storage_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = ANY (ARRAY['receipts', 'job-media', 'cms-media', 'media-library', 'lead-media']))
  WITH CHECK (bucket_id = ANY (ARRAY['receipts', 'job-media', 'cms-media', 'media-library', 'lead-media']));
