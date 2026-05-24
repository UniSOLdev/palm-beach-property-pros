-- Public quote share links + pipeline hardening (idempotent)

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

-- Allow anon read of client name/contact on shared documents (matches invoice share pattern)
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

-- Ensure authenticated admin policies exist on quotes (may pre-exist)
DROP POLICY IF EXISTS admin_all_quotes ON public.quotes;
CREATE POLICY admin_all_quotes ON public.quotes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_quote_items ON public.quote_items;
CREATE POLICY admin_all_quote_items ON public.quote_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
