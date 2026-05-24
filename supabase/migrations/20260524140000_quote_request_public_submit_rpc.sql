-- Public quote submission RPC — works without service role key (SECURITY DEFINER bypasses RLS)

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
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;
  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RAISE EXCEPTION 'phone is required';
  END IF;
  IF p_service_requested IS NULL OR trim(p_service_requested) = '' THEN
    RAISE EXCEPTION 'service is required';
  END IF;
  IF p_address IS NULL OR trim(p_address) = '' THEN
    RAISE EXCEPTION 'address is required';
  END IF;

  INSERT INTO public.quote_requests (
    name,
    phone,
    email,
    service_requested,
    address,
    city,
    property_type,
    message,
    preferred_contact,
    preferred_date,
    preferred_time,
    source,
    referrer,
    status,
    photo_urls
  ) VALUES (
    trim(p_name),
    trim(p_phone),
    NULLIF(trim(coalesce(p_email, '')), ''),
    trim(p_service_requested),
    trim(p_address),
    NULLIF(trim(coalesce(p_city, '')), ''),
    NULLIF(trim(coalesce(p_property_type, '')), ''),
    NULLIF(trim(coalesce(p_message, '')), ''),
    COALESCE(NULLIF(trim(coalesce(p_preferred_contact, '')), ''), 'Call'),
    p_preferred_date,
    NULLIF(trim(coalesce(p_preferred_time, '')), ''),
    COALESCE(NULLIF(trim(coalesce(p_source, '')), ''), 'website'),
    NULLIF(trim(coalesce(p_referrer, '')), ''),
    'new',
    '[]'::jsonb
  )
  RETURNING id INTO v_id;

  INSERT INTO public.quote_request_activity (quote_request_id, activity_type, body)
  VALUES (v_id, 'system', 'Quote request submitted from website');

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_quote_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_quote_request TO anon, authenticated, service_role;

-- Service role storage uploads (belt-and-suspenders; service role usually bypasses RLS)
DROP POLICY IF EXISTS service_role_lead_media ON storage.objects;
CREATE POLICY service_role_lead_media ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'lead-media')
  WITH CHECK (bucket_id = 'lead-media');
