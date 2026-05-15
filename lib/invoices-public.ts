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
  };
  client: {
    full_name: string;
    phone: string | null;
    email: string | null;
  } | null;
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
      clients ( full_name, phone, email )
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
    clients:
      | { full_name: string; phone: string | null; email: string | null }
      | { full_name: string; phone: string | null; email: string | null }[]
      | null;
  };

  const { clients: raw, ...inv } = row;
  const clientRow = Array.isArray(raw) ? (raw[0] ?? null) : raw;
  return {
    invoice: inv,
    client: clientRow,
  };
}
