-- Change orders + scope approval (non-destructive)

CREATE TABLE IF NOT EXISTS change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  change_order_number text NOT NULL,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'declined', 'void')),
  title text NOT NULL DEFAULT 'Change Order',
  scope_change_reason text,
  notes text,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  tax_rate numeric(6, 4) NOT NULL DEFAULT 0,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  client_name text,
  client_email text,
  client_phone text,
  approval_signature_name text,
  approval_signature_text text,
  approval_ip text,
  approval_user_agent text,
  approval_terms_version text,
  approval_snapshot_json jsonb,
  decline_reason text,
  sent_at timestamptz,
  approved_at timestamptz,
  declined_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS change_orders_job_id_idx ON change_orders(job_id);
CREATE INDEX IF NOT EXISTS change_orders_client_id_idx ON change_orders(client_id);
CREATE INDEX IF NOT EXISTS change_orders_status_idx ON change_orders(status);
CREATE INDEX IF NOT EXISTS change_orders_public_id_idx ON change_orders(public_id);

CREATE TABLE IF NOT EXISTS change_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id uuid NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(12, 2) NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  line_total numeric(12, 2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS change_order_items_co_id_idx ON change_order_items(change_order_id);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS change_order_id uuid REFERENCES change_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tasks_change_order_id_idx ON tasks(change_order_id);

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_change_orders ON change_orders;
CREATE POLICY admin_all_change_orders ON change_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_change_order_items ON change_order_items;
CREATE POLICY admin_all_change_order_items ON change_order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS co_anon_select ON change_orders;
CREATE POLICY co_anon_select ON change_orders
  FOR SELECT TO anon
  USING (archived = false AND status IN ('sent', 'approved', 'declined'));

DROP POLICY IF EXISTS co_items_anon_select ON change_order_items;
CREATE POLICY co_items_anon_select ON change_order_items
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM change_orders co
      WHERE co.id = change_order_items.change_order_id
        AND co.archived = false
        AND co.status IN ('sent', 'approved', 'declined')
    )
  );

CREATE OR REPLACE FUNCTION public.submit_change_order_approval(
  p_public_id text,
  p_action text,
  p_signature_name text DEFAULT NULL,
  p_decline_reason text DEFAULT NULL,
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  co change_orders%ROWTYPE;
  snap jsonb;
BEGIN
  SELECT * INTO co FROM change_orders
  WHERE public_id = p_public_id AND archived = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change order not found';
  END IF;

  IF co.status = 'approved' THEN
    RETURN jsonb_build_object('ok', true, 'already_approved', true, 'status', co.status);
  END IF;

  IF co.status = 'declined' AND p_action = 'decline' THEN
    RETURN jsonb_build_object('ok', true, 'already_declined', true, 'status', co.status);
  END IF;

  IF co.status <> 'sent' THEN
    RAISE EXCEPTION 'Change order is not available for approval';
  END IF;

  snap := co.approval_snapshot_json;

  IF p_action = 'approve' THEN
    IF p_signature_name IS NULL OR length(trim(p_signature_name)) < 2 THEN
      RAISE EXCEPTION 'Signature name is required';
    END IF;
    UPDATE change_orders SET
      status = 'approved',
      approval_signature_name = trim(p_signature_name),
      approval_signature_text = trim(p_signature_name),
      approval_ip = p_ip,
      approval_user_agent = p_user_agent,
      approval_terms_version = COALESCE(approval_terms_version, '1.0'),
      approved_at = now(),
      updated_at = now()
    WHERE id = co.id;
    RETURN jsonb_build_object('ok', true, 'status', 'approved');
  ELSIF p_action = 'decline' THEN
    UPDATE change_orders SET
      status = 'declined',
      decline_reason = NULLIF(trim(p_decline_reason), ''),
      approval_ip = p_ip,
      approval_user_agent = p_user_agent,
      declined_at = now(),
      updated_at = now()
    WHERE id = co.id;
    RETURN jsonb_build_object('ok', true, 'status', 'declined');
  ELSE
    RAISE EXCEPTION 'Invalid action';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_change_order_approval(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_change_order_approval(text, text, text, text, text, text) TO anon, authenticated;
