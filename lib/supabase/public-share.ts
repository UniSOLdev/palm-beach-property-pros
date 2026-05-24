import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { createServiceClient } from "@/lib/supabase/service";

const PUBLIC_QUOTE_SELECT = `
  id,
  public_id,
  quote_number,
  service_type,
  job_address,
  status,
  notes,
  terms,
  expiration_date,
  deposit_required,
  deposit_amount,
  approval_status,
  viewed_at,
  sent_at,
  signed_at,
  signed_name,
  signed_ip,
  client_signature_url,
  signed_pdf_url,
  declined_at,
  archived,
  clients(name, email, phone, address),
  quote_items(id, description, quantity, unit_price, sort_order, is_addon)
`;

/** Server-only public share reads — scoped by public_id, bypasses anon RLS gaps. */
export async function fetchPublicQuote(publicId: string) {
  try {
    const supabase = createServiceClient();
    const { data: quote, error } = await supabase
      .from("quotes")
      .select(PUBLIC_QUOTE_SELECT)
      .eq("public_id", publicId)
      .eq("archived", false)
      .maybeSingle();

    if (error) {
      logPipelineError("public quote lookup failed", error, { step: "fetchPublicQuote", publicId });
      return { ok: false as const, reason: "error" as const, message: error.message };
    }
    if (!quote) {
      logPipelineInfo("public quote not found", { step: "fetchPublicQuote", publicId });
      return { ok: false as const, reason: "not_found" as const };
    }

    const row = quote as Record<string, unknown>;
    const nestedItems = Array.isArray(row.quote_items) ? row.quote_items : [];

    // Fallback: fetch items separately if join returned empty (legacy path)
    let items = nestedItems;
    if (!items.length) {
      const { data: fallbackItems, error: itemsError } = await supabase
        .from("quote_items")
        .select("id, description, quantity, unit_price, sort_order, is_addon")
        .eq("quote_id", String(row.id ?? ""))
        .order("sort_order");

      if (itemsError) {
        logPipelineError("public quote items lookup failed", itemsError, {
          step: "fetchPublicQuote",
          publicId,
          quoteId: String(row.id ?? ""),
        });
        return { ok: false as const, reason: "error" as const, message: itemsError.message };
      }
      items = fallbackItems ?? [];
    }

    return { ok: true as const, quote: row, items };
  } catch (error) {
    logPipelineError("public quote fetch exception", error, { step: "fetchPublicQuote", publicId });
    return { ok: false as const, reason: "error" as const, message: "Unable to load quote." };
  }
}


export async function fetchPublicInvoice(publicId: string) {
  try {
    const supabase = createServiceClient();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, clients(name, address)")
      .eq("public_id", publicId)
      .eq("archived", false)
      .maybeSingle();

    if (error) {
      logPipelineError("public invoice lookup failed", error, { step: "fetchPublicInvoice", publicId });
      return { ok: false as const, reason: "error" as const, message: error.message };
    }
    if (!invoice) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const [{ data: items, error: itemsError }, { data: settings, error: settingsError }] =
      await Promise.all([
        supabase.from("invoice_items").select("*").eq("invoice_id", invoice.id).order("sort_order"),
        supabase.from("business_settings").select("*").limit(1).maybeSingle(),
      ]);

    if (itemsError) {
      logPipelineError("public invoice items lookup failed", itemsError, {
        step: "fetchPublicInvoice",
        publicId,
      });
      return { ok: false as const, reason: "error" as const, message: itemsError.message };
    }
    if (settingsError) {
      logPipelineError("public invoice settings lookup failed", settingsError, {
        step: "fetchPublicInvoice",
        publicId,
      });
    }

    return { ok: true as const, invoice, items: items ?? [], settings: settings ?? null };
  } catch (error) {
    logPipelineError("public invoice fetch exception", error, { step: "fetchPublicInvoice", publicId });
    return { ok: false as const, reason: "error" as const, message: "Unable to load invoice." };
  }
}
