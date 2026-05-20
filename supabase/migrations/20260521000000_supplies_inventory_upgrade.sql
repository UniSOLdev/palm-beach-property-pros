-- Supplies inventory upgrade (non-destructive)

ALTER TABLE supplies ADD COLUMN IF NOT EXISTS is_reusable boolean NOT NULL DEFAULT false;
ALTER TABLE supplies ADD COLUMN IF NOT EXISTS expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL;
ALTER TABLE supplies ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS supply_job_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id uuid NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  quantity_used numeric(12, 2) NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS supply_job_usage_supply_id_idx ON supply_job_usage(supply_id);
CREATE INDEX IF NOT EXISTS supply_job_usage_job_id_idx ON supply_job_usage(job_id);

ALTER TABLE supply_job_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_supply_job_usage ON supply_job_usage;
CREATE POLICY admin_all_supply_job_usage ON supply_job_usage
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
