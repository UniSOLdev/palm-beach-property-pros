import { createServiceSupabase } from "@/lib/supabase/service";

export type PublicInvoicePayload = {
  invoice: {
    id: string;
    title: string | null;
    status: string;
    currency: string;
    line_items: { description: string; quantity: number; unit_cents: number }[];
    subtotal_cents: number;
    tax_cents: number;
    total_cents: number;
    public_token: string;
    created_at: string;
    client_id: string | null;
    invoice_number: string | null;
    service_address: string | null;
    prepared_by: string;
    issue_date: string | null;
    due_date: string | null;
    scope_notes: string | null;
    client_message: string | null;
    revision_number: number;
  };
  client: {
    full_name: string;
    phone: string | null;
    email: string | null;
  } | null;
  payments: { id: string; payment_date: string; method: string; description: string | null; amount_cents: number; reference: string | null }[];
  scope_changes: { id: string; change_type: string; title: string; description: string | null; amount_cents: number; acknowledged_at: string | null; acknowledged_by: string | null; created_at: string }[];
  payment_total_cents: number;
  balance_cents: number;
};

export async function getPublicInvoiceByToken(
  token: string,
): Promise<PublicInvoicePayload | null> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      `
      id,
      title,
      status,
      currency,
      line_items,
      subtotal_cents,
      tax_cents,
      total_cents,
      public_token,
      created_at,
      client_id,
      invoice_number,
      service_address,
      prepared_by,
      issue_date,
      due_date,
      scope_notes,
      client_message,
      revision_number,
      clients ( full_name, phone, email ),
      invoice_payments ( id, payment_date, method, description, amount_cents, reference ),
      invoice_scope_changes ( id, change_type, title, description, amount_cents, acknowledged_at, acknowledged_by, created_at )
    `,
    )
    .eq("public_token", token)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    id: string;
    title: string | null;
    status: string;
    currency: string;
    line_items: PublicInvoicePayload["invoice"]["line_items"];
    subtotal_cents: number;
    tax_cents: number;
    total_cents: number;
    public_token: string;
    created_at: string;
    client_id: string | null;
    invoice_number: string | null;
    service_address: string | null;
    prepared_by: string;
    issue_date: string | null;
    due_date: string | null;
    scope_notes: string | null;
    client_message: string | null;
    revision_number: number;
    invoice_payments: PublicInvoicePayload["payments"] | null;
    invoice_scope_changes: PublicInvoicePayload["scope_changes"] | null;
    clients:
      | { full_name: string; phone: string | null; email: string | null }
      | { full_name: string; phone: string | null; email: string | null }[]
      | null;
  };

  const { clients: raw, invoice_payments, invoice_scope_changes, ...inv } = row;
  const clientRow = Array.isArray(raw) ? (raw[0] ?? null) : raw;
  const payments = (invoice_payments ?? []).map((payment) => ({
    ...payment,
    amount_cents: Math.round(Number(payment.amount_cents) || 0),
  }));
  const scope_changes = (invoice_scope_changes ?? []).map((change) => ({
    ...change,
    amount_cents: Math.round(Number(change.amount_cents) || 0),
  }));
  const payment_total_cents = payments.reduce((sum, payment) => sum + payment.amount_cents, 0);
  return {
    invoice: inv,
    client: clientRow,
    payments,
    scope_changes,
    payment_total_cents,
    balance_cents: Math.max(0, Math.round(Number(inv.total_cents) || 0) - payment_total_cents),
  };
}
