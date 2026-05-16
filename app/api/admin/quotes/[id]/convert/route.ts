import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Converts the current database row for this quote into an invoice.
 * Call only after the latest quote has been saved (PUT) and optionally re-fetched (GET).
 */
export async function POST(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.rpc("convert_quote_to_invoice", { p_quote_id: id });

    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("QUOTE_NOT_FOUND")) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }
      if (msg.includes("QUOTE_ALREADY_CONVERTED")) {
        return NextResponse.json({ error: "Quote already converted" }, { status: 409 });
      }
      if (msg.includes("QUOTE_VOID")) {
        return NextResponse.json({ error: "Quote is void" }, { status: 400 });
      }
      throw error;
    }

    const row = data as { invoice_id?: string; public_token?: string; quote_id?: string } | null;
    if (!row?.public_token) {
      return NextResponse.json({ error: "Conversion returned no invoice" }, { status: 503 });
    }

    return NextResponse.json({
      invoice_id: row.invoice_id,
      public_token: row.public_token,
      quote_id: row.quote_id ?? id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
