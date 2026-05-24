import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { createServiceClient } from "@/lib/supabase/service";

/** Server-only public share reads — scoped by public_id, bypasses anon RLS gaps. */
export async function fetchPublicQuote(publicId: string) {
  try {
    const supabase = createServiceClient();
    const { data: quote, error } = await supabase
      .from("quotes")
      .select("*, clients(name, email, phone, address)")
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

    const { data: items, error: itemsError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quote.id)
      .order("sort_order");

    if (itemsError) {
      logPipelineError("public quote items lookup failed", itemsError, {
        step: "fetchPublicQuote",
        publicId,
        quoteId: quote.id,
      });
      return { ok: false as const, reason: "error" as const, message: itemsError.message };
    }

    return { ok: true as const, quote, items: items ?? [] };
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
