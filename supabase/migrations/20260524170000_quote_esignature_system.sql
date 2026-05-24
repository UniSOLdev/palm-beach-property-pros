-- Quote e-signature system: approval columns, audit events, signed document storage

-- ── Quote approval / signature columns ───────────────────────────────────────
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_name text,
  ADD COLUMN IF NOT EXISTS signed_ip text,
  ADD COLUMN IF NOT EXISTS client_signature_url text,
  ADD COLUMN IF NOT EXISTS signed_pdf_url text,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz;

UPDATE public.quotes SET approval_status = 'pending' WHERE approval_status IS NULL;
ALTER TABLE public.quotes ALTER COLUMN approval_status SET DEFAULT 'pending';
ALTER TABLE public.quotes ALTER COLUMN approval_status SET NOT NULL;

ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_approval_status_check;
ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_approval_status_check
  CHECK (approval_status IN ('pending', 'viewed', 'signed', 'declined'));

CREATE INDEX IF NOT EXISTS quotes_public_id_idx ON public.quotes(public_id);
CREATE INDEX IF NOT EXISTS quotes_approval_status_idx ON public.quotes(approval_status);

-- ── Quote event audit log ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  type text NOT NULL,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_events_quote_id_idx
  ON public.quote_events(quote_id, created_at DESC);

ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_quote_events ON public.quote_events;
CREATE POLICY admin_all_quote_events ON public.quote_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_quote_events ON public.quote_events;
CREATE POLICY service_role_all_quote_events ON public.quote_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Signed documents storage bucket ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-documents',
  'signed-documents',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS admin_signed_documents ON storage.objects;
CREATE POLICY admin_signed_documents ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'signed-documents')
  WITH CHECK (bucket_id = 'signed-documents');

DROP POLICY IF EXISTS service_role_signed_documents ON storage.objects;
CREATE POLICY service_role_signed_documents ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'signed-documents')
  WITH CHECK (bucket_id = 'signed-documents');

-- Extend admin storage policy
DROP POLICY IF EXISTS admin_storage_all ON storage.objects;
CREATE POLICY admin_storage_all ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = ANY (
      ARRAY['receipts', 'job-media', 'cms-media', 'media-library', 'lead-media', 'signed-documents']
    )
  )
  WITH CHECK (
    bucket_id = ANY (
      ARRAY['receipts', 'job-media', 'cms-media', 'media-library', 'lead-media', 'signed-documents']
    )
  );

-- ── Helper: log quote events (service role / SECURITY DEFINER safe) ───────────
CREATE OR REPLACE FUNCTION public.log_quote_event(
  p_quote_id uuid,
  p_type text,
  p_note text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.quote_events (quote_id, type, note, metadata)
  VALUES (p_quote_id, p_type, p_note, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_quote_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_quote_event TO service_role, authenticated;

-- ── Mark quote viewed (public via RPC — scoped by public_id) ────────────────
CREATE OR REPLACE FUNCTION public.mark_quote_viewed(p_public_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote public.quotes%ROWTYPE;
BEGIN
  SELECT * INTO v_quote FROM public.quotes
  WHERE public_id = p_public_id AND archived = false;

  IF NOT FOUND THEN RETURN false; END IF;

  IF v_quote.approval_status = 'pending' THEN
    UPDATE public.quotes
    SET approval_status = 'viewed', viewed_at = now()
    WHERE id = v_quote.id;

    PERFORM public.log_quote_event(v_quote.id, 'viewed', 'Client opened quote link');
  ELSIF v_quote.viewed_at IS NULL AND v_quote.approval_status IN ('viewed', 'signed', 'declined') THEN
    UPDATE public.quotes SET viewed_at = now() WHERE id = v_quote.id;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_quote_viewed FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_quote_viewed TO anon, authenticated, service_role;
