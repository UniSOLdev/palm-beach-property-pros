import { NextResponse } from "next/server";
import type { InvoiceLineItem } from "@/lib/db-types";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { invoiceTotalsFromLines } from "@/lib/invoice-math";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "120") || 120, 300);

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, title, public_token, client_id, total_cents, status, created_at, quote_reference_code",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ invoices: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    client_id?: string | null;
    title?: string | null;
    status?: string;
    tax_cents?: number;
    line_items?: InvoiceLineItem[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const line_items: InvoiceLineItem[] = Array.isArray(body.line_items) ? body.line_items : [];
  const tax_cents = Math.max(0, Math.round(Number(body.tax_cents) || 0));
  const { subtotal_cents, total_cents } = invoiceTotalsFromLines(line_items, tax_cents);

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        client_id: body.client_id ?? null,
        title: body.title?.trim() || null,
        status: body.status?.trim() || "draft",
        line_items,
        subtotal_cents,
        tax_cents,
        total_cents,
      })
      .select("id, public_token, client_id, total_cents, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ invoice: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
