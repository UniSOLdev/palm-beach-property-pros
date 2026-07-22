
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_crew_member_id uuid REFERENCES public.crew_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid;

UPDATE public.tasks SET status = 'todo' WHERE status = 'open';
UPDATE public.tasks SET status = 'done' WHERE status = 'completed';
UPDATE public.tasks SET priority = 'medium' WHERE priority = 'normal';

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled'));

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

CREATE INDEX IF NOT EXISTS tasks_job_id_idx ON public.tasks (job_id) WHERE archived = false;
CREATE INDEX IF NOT EXISTS tasks_client_id_idx ON public.tasks (client_id) WHERE archived = false;
CREATE INDEX IF NOT EXISTS tasks_invoice_id_idx ON public.tasks (invoice_id) WHERE archived = false;
;
