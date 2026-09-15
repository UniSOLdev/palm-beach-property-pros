-- PBPP Autopilot OS — foundation tables for scheduled automation, comms, outreach, receptionist, content, payments

-- ---------------------------------------------------------------------------
-- Automation run log (idempotency + observability for cron jobs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_key text NOT NULL,
  run_key text NOT NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  UNIQUE (job_key, run_key)
);

CREATE INDEX IF NOT EXISTS automation_runs_job_started_idx
  ON public.automation_runs (job_key, started_at DESC);

-- ---------------------------------------------------------------------------
-- Data-driven task rules (inventory, leads, jobs, invoices, outreach)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  category text NOT NULL DEFAULT 'ops'
    CHECK (category IN ('ops', 'inventory', 'leads', 'jobs', 'finance', 'outreach', 'marketing', 'growth')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  cooldown_hours int NOT NULL DEFAULT 24,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_rule_firings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  fired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_key, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS task_rule_firings_rule_fired_idx
  ON public.task_rule_firings (rule_key, fired_at DESC);

-- ---------------------------------------------------------------------------
-- Message templates + comms log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comms_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  template_key text,
  recipient text NOT NULL,
  subject text,
  body_preview text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'skipped')),
  entity_type text,
  entity_id uuid,
  provider_id text,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS comms_log_entity_idx ON public.comms_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS comms_log_created_idx ON public.comms_log (created_at DESC);

-- ---------------------------------------------------------------------------
-- Outreach sequences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.outreach_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_key text NOT NULL UNIQUE,
  name text NOT NULL,
  prospect_type text,
  enabled boolean NOT NULL DEFAULT true,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outreach_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.outreach_prospects(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES public.outreach_sequences(id) ON DELETE CASCADE,
  current_step int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'stopped')),
  next_action_at timestamptz,
  last_action_at timestamptz,
  draft_subject text,
  draft_body text,
  approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'sent', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prospect_id, sequence_id)
);

CREATE INDEX IF NOT EXISTS outreach_enrollments_next_action_idx
  ON public.outreach_enrollments (next_action_at)
  WHERE status = 'active' AND approval_status IN ('pending', 'approved');

-- ---------------------------------------------------------------------------
-- AI receptionist call/SMS log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receptionist_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('sms', 'voice', 'missed_call')),
  direction text NOT NULL DEFAULT 'inbound'
    CHECK (direction IN ('inbound', 'outbound')),
  from_number text,
  to_number text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'qualified', 'escalated', 'closed')),
  transcript text,
  summary text,
  intent text,
  quote_request_id uuid REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  provider_call_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receptionist_sessions_created_idx
  ON public.receptionist_sessions (created_at DESC);

-- ---------------------------------------------------------------------------
-- Content drafts queue (website autopilot)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_key text NOT NULL UNIQUE,
  draft_type text NOT NULL
    CHECK (draft_type IN ('homepage_section', 'project_page', 'testimonial', 'service_copy', 'social_post')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'scheduled', 'published', 'rejected')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_entity_type text,
  source_entity_id uuid,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_drafts_status_idx ON public.content_drafts (status, scheduled_at);

-- ---------------------------------------------------------------------------
-- Payment links (Stripe)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'expired', 'failed', 'refunded')),
  checkout_url text,
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_links_invoice_idx ON public.payment_links (invoice_id);
CREATE INDEX IF NOT EXISTS payment_links_stripe_session_idx ON public.payment_links (stripe_checkout_session_id);

-- ---------------------------------------------------------------------------
-- RLS — service role / authenticated admin only
-- ---------------------------------------------------------------------------
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_rule_firings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comms_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receptionist_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'automation_runs', 'task_rules', 'task_rule_firings', 'message_templates', 'comms_log',
    'outreach_sequences', 'outreach_enrollments', 'receptionist_sessions', 'content_drafts', 'payment_links'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS admin_all_%I ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY admin_all_%I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- updated_at triggers
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'task_rules', 'message_templates', 'outreach_sequences', 'outreach_enrollments',
    'receptionist_sessions', 'content_drafts', 'payment_links'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER %I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Seed: default task rules
-- ---------------------------------------------------------------------------
INSERT INTO public.task_rules (rule_key, name, description, category, priority, cooldown_hours) VALUES
  ('low_stock_reorder', 'Low stock reorder', 'Create task when supply quantity falls below reorder level', 'inventory', 'high', 72),
  ('lead_sla_breach', 'Lead SLA breach', 'New lead untouched for 2+ hours', 'leads', 'urgent', 4),
  ('quote_follow_up', 'Quote follow-up', 'Sent quote with no response after 3 days', 'leads', 'high', 72),
  ('invoice_overdue', 'Invoice overdue', 'Unpaid invoice past due date', 'finance', 'high', 168),
  ('job_prep_tomorrow', 'Job prep tomorrow', 'Job scheduled tomorrow needs prep checklist', 'jobs', 'medium', 24),
  ('outreach_follow_up_due', 'Outreach follow-up due', 'B2B prospect follow-up date reached', 'outreach', 'medium', 48),
  ('crew_payout_review', 'Crew payout review', 'Weekly crew payout summary for review', 'finance', 'medium', 168)
ON CONFLICT (rule_key) DO NOTHING;

-- Allow same logical template key per channel (email + sms)
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS message_templates_template_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS message_templates_key_channel_idx
  ON public.message_templates (template_key, channel);

-- ---------------------------------------------------------------------------
-- Seed: message templates
-- ---------------------------------------------------------------------------
INSERT INTO public.message_templates (template_key, channel, name, subject, body) VALUES
  (
    'lead_ack',
    'email',
    'Lead acknowledgment',
    'We received your request — Palm Beach Property Pros',
    'Hi {{name}}, thanks for reaching out to Palm Beach Property Pros. We received your request for {{service}} and will follow up shortly. You can also text us at 561-629-2617. — PBPP Team'
  ),
  (
    'lead_ack',
    'sms',
    'Lead acknowledgment SMS',
    NULL,
    'Hi {{name}}! Palm Beach Property Pros received your request. We''ll follow up soon. Reply with photos or details anytime. — PBPP'
  ),
  (
    'quote_sent',
    'email',
    'Quote sent notification',
    'Your PBPP quote is ready',
    'Hi {{name}}, your quote #{{quote_number}} is ready to review and sign: {{quote_url}}'
  ),
  (
    'invoice_reminder',
    'email',
    'Invoice payment reminder',
    'Invoice reminder — Palm Beach Property Pros',
    'Hi {{name}}, invoice #{{invoice_number}} for {{amount}} is due. Pay here: {{payment_url}}'
  ),
  (
    'missed_call_sms',
    'sms',
    'Missed call text-back',
    NULL,
    'Thanks for calling Palm Beach Property Pros! We missed your call. Reply with your address and what you need help with, or request a quote: {{quote_url}}'
  ),
  (
    'review_request',
    'email',
    'Post-job review request',
    'How did we do?',
    'Hi {{name}}, thanks for choosing Palm Beach Property Pros for {{service}}. If you have a moment, we''d love a Google review: {{review_url}}'
  ),
  (
    'weekly_ops_digest',
    'email',
    'Weekly ops digest',
    'PBPP Weekly Ops Digest',
    'Weekly summary: {{new_leads}} new leads, {{jobs_scheduled}} jobs scheduled, {{open_invoices}} open invoices, {{low_stock_count}} low-stock items.'
  )
ON CONFLICT (template_key, channel) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: default outreach sequence
-- ---------------------------------------------------------------------------
INSERT INTO public.outreach_sequences (sequence_key, name, prospect_type, steps) VALUES
  (
    'pm_vendor_intro',
    'Property manager vendor intro',
    'property_manager',
    '[
      {"step": 0, "delay_days": 0, "channel": "email", "template": "pm_intro"},
      {"step": 1, "delay_days": 4, "channel": "email", "template": "pm_follow_up_1"},
      {"step": 2, "delay_days": 10, "channel": "email", "template": "pm_follow_up_2"}
    ]'::jsonb
  ),
  (
    'str_turnover_pitch',
    'STR turnover pitch',
    'str_manager',
    '[
      {"step": 0, "delay_days": 0, "channel": "email", "template": "str_intro"},
      {"step": 1, "delay_days": 5, "channel": "email", "template": "str_follow_up"}
    ]'::jsonb
  )
ON CONFLICT (sequence_key) DO NOTHING;
