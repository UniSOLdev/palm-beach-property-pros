import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { totalsWithDiscount } from "@/lib/invoice-math";
import { mapQuoteRow, normalizeQuoteStatus, parseLineItems } from "@/lib/quote-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ quote: mapQuoteRow(data as Record<string, unknown>) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    row_version?: number;
    client_id?: string | null;
    service_type?: string | null;
    property_address?: string | null;
    notes?: string | null;
    customer_notes?: string | null;
    terms?: string | null;
    internal_notes?: string | null;
    line_items?: unknown;
    tax_cents?: number;
    discount_cents?: number;
    deposit_cents?: number;
    status?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expectedVersion = Number(body.row_version);
  if (!Number.isFinite(expectedVersion)) {
    return NextResponse.json({ error: "row_version is required" }, { status: 400 });
  }

  const line_items = parseLineItems(body.line_items);
  const tax_cents = Math.max(0, Math.round(Number(body.tax_cents) || 0));
  const discount_cents = Math.max(0, Math.round(Number(body.discount_cents) || 0));
  const deposit_cents = Math.max(0, Math.round(Number(body.deposit_cents) || 0));
  const fin = totalsWithDiscount(line_items, tax_cents, discount_cents);

  try {
    const supabase = createServiceSupabase();

    const { data: current, error: curErr } = await supabase
      .from("quotes")
      .select("row_version, status")
      .eq("id", id)
      .maybeSingle();

    if (curErr) throw curErr;
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (String(current.status) === "converted") {
      return NextResponse.json({ error: "Quote is already converted" }, { status: 409 });
    }

    if (Number(current.row_version) !== expectedVersion) {
      return NextResponse.json(
        {
          error: "ROW_VERSION_MISMATCH",
          message: "Quote was updated elsewhere. Reload and try again.",
          server_row_version: current.row_version,
        },
        { status: 409 },
      );
    }

    const nextStatus =
      typeof body.status === "string"
        ? normalizeQuoteStatus(body.status)
        : normalizeQuoteStatus(String(current.status));

    if (nextStatus === "converted") {
      return NextResponse.json(
        { error: "Status cannot be set to converted via save; use convert action." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("quotes")
      .update({
        client_id: body.client_id?.trim() || null,
        service_type: body.service_type?.trim() || null,
        property_address: body.property_address?.trim() || null,
        notes: body.notes?.trim() || null,
        customer_notes: body.customer_notes?.trim() || null,
        terms: body.terms?.trim() || null,
        internal_notes: body.internal_notes?.trim() || null,
        line_items,
        subtotal_cents: fin.subtotal_cents,
        tax_cents: fin.tax_cents,
        discount_cents: fin.discount_cents,
        deposit_cents,
        total_cents: fin.total_cents,
        status: nextStatus,
        updated_at: new Date().toISOString(),
        row_version: expectedVersion + 1,
      })
      .eq("id", id)
      .eq("row_version", expectedVersion)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        {
          error: "ROW_VERSION_MISMATCH",
          message: "Concurrent update detected. Reload and try again.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ quote: mapQuoteRow(data as Record<string, unknown>) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
