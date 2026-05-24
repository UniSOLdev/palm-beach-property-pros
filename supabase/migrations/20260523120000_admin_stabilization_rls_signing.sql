-- Enable RLS on tables that had policies but RLS disabled (non-destructive)
ALTER TABLE public.cms_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Lightweight e-signature requests (internal, no paid dependency)
CREATE TABLE IF NOT EXISTS public.signing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  document_type text NOT NULL CHECK (document_type IN ('invoice', 'quote', 'change_order', 'work_authorization')),
  document_public_id text NOT NULL,
  document_id uuid,
  title text NOT NULL DEFAULT 'Document Signature',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined', 'expired', 'void')),
  signer_name text,
  signature_type text CHECK (signature_type IS NULL OR signature_type IN ('typed', 'drawn')),
  signature_data text,
  signer_ip text,
  signer_user_agent text,
  signed_at timestamptz,
  expires_at timestamptz,
  audit_json jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signing_requests_token_idx ON public.signing_requests(token);
CREATE INDEX IF NOT EXISTS signing_requests_document_idx ON public.signing_requests(document_type, document_public_id);

ALTER TABLE public.signing_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_signing_requests ON public.signing_requests;
CREATE POLICY admin_all_signing_requests ON public.signing_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS signing_anon_read ON public.signing_requests;
CREATE POLICY signing_anon_read ON public.signing_requests
  FOR SELECT TO anon
  USING (status IN ('pending', 'signed') AND (expires_at IS NULL OR expires_at > now()));
