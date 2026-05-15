import { NextResponse } from "next/server";
import type { InvoiceLineItem } from "@/lib/db-types";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { invoiceTotalsFromLines } from "@/lib/invoice-math";
import { createServiceSupabase } from "@/lib/supabase/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, clients(id, full_name, phone, email)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ invoice: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

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

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("client_id" in body) patch.client_id = body.client_id ?? null;
  if ("title" in body) patch.title = body.title?.trim() || null;
  if ("status" in body) patch.status = body.status?.trim() || "draft";

  if (Array.isArray(body.line_items)) {
    const tax_cents = Math.max(0, Math.round(Number(body.tax_cents) || 0));
    const { subtotal_cents, total_cents } = invoiceTotalsFromLines(body.line_items, tax_cents);
    patch.line_items = body.line_items;
    patch.subtotal_cents = subtotal_cents;
    patch.tax_cents = tax_cents;
    patch.total_cents = total_cents;
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("invoices").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ invoice: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
