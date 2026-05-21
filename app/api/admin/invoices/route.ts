import { NextResponse } from "next/server";
import type { InvoiceLineItem } from "@/lib/db-types";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { invoiceTotalsFromLines } from "@/lib/invoice-math";
import { replaceInvoiceLineItems } from "@/lib/invoice-workflow";
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
    service_address?: string | null;
    prepared_by?: string | null;
    issue_date?: string | null;
    due_date?: string | null;
    invoice_number?: string | null;
    scope_notes?: string | null;
    client_message?: string | null;
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
        service_address: body.service_address?.trim() || null,
        prepared_by: body.prepared_by?.trim() || "Palm Beach Property Pros",
        issue_date: body.issue_date || new Date().toISOString().slice(0, 10),
        due_date: body.due_date || null,
        invoice_number: body.invoice_number?.trim() || null,
        scope_notes: body.scope_notes?.trim() || null,
        client_message: body.client_message?.trim() || null,
      })
      .select("id, public_token, client_id, total_cents, created_at")
      .single();

    if (error) throw error;
    await replaceInvoiceLineItems(supabase, String(data.id), line_items);
    await supabase.from("invoice_audit_events").insert({
      invoice_id: data.id,
      event_type: "invoice.created",
      summary: "Invoice created",
      after_snapshot: data,
    });
    return NextResponse.json({ invoice: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
