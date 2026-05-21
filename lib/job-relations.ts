import type { SupabaseClient } from "@supabase/supabase-js";

export type JobRelationInput = {
  client_id: string | null;
  quote_id: string | null;
  invoice_id: string | null;
};

/**
 * Validates FK targets and aligns job.client_id with linked quote/invoice clients
 * so relational data cannot silently drift (e.g. wrong client on save).
 */
export async function resolveJobClientAndValidate(
  supabase: SupabaseClient,
  input: JobRelationInput,
): Promise<{ ok: true; client_id: string | null } | { ok: false; message: string }> {
  let client_id = input.client_id?.trim() || null;
  const quote_id = input.quote_id?.trim() || null;
  const invoice_id = input.invoice_id?.trim() || null;

  if (client_id) {
    const { data, error } = await supabase.from("clients").select("id").eq("id", client_id).maybeSingle();
    if (error) return { ok: false, message: error.message };
    if (!data) return { ok: false, message: "Selected client does not exist in the database." };
  }

  if (quote_id) {
    const { data: q, error } = await supabase
      .from("quotes")
      .select("id, client_id")
      .eq("id", quote_id)
      .maybeSingle();
    if (error) return { ok: false, message: error.message };
    if (!q) return { ok: false, message: "Linked quote was not found." };
    const qc = q.client_id ? String(q.client_id) : null;
    if (qc) {
      if (client_id && client_id !== qc) {
        return {
          ok: false,
          message:
            "Client must match the linked quote’s client. Clear the quote link or select the correct client.",
        };
      }
      client_id = qc;
    }
  }

  if (invoice_id) {
    const { data: inv, error } = await supabase
      .from("invoices")
      .select("id, client_id")
      .eq("id", invoice_id)
      .maybeSingle();
    if (error) return { ok: false, message: error.message };
    if (!inv) return { ok: false, message: "Linked invoice was not found." };
    const ic = inv.client_id ? String(inv.client_id) : null;
    if (ic) {
      if (client_id && client_id !== ic) {
        return {
          ok: false,
          message:
            "Client must match the linked invoice’s client. Clear the invoice link or select the correct client.",
        };
      }
      client_id = ic;
    }
  }

  if (client_id) {
    const { data, error } = await supabase.from("clients").select("id").eq("id", client_id).maybeSingle();
    if (error) return { ok: false, message: error.message };
    if (!data) return { ok: false, message: "Client could not be resolved after quote/invoice alignment." };
  }

  return { ok: true, client_id };
}
