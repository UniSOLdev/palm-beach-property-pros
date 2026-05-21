import { NextResponse } from "next/server";
import type { InvoiceLineItem, InvoicePaymentRow, InvoiceScopeChangeRow } from "@/lib/db-types";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { invoiceTotalsFromLines } from "@/lib/invoice-math";
import {
  paymentTotalCents,
  replaceInvoiceLineItems,
  replaceInvoicePayments,
  replaceInvoiceScopeChanges,
  scopeChangeTotalCents,
} from "@/lib/invoice-workflow";
import { logOperationalActivity } from "@/lib/ops/activity";
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
      .select("*, clients(id, full_name, phone, email), invoice_payments(*), invoice_scope_changes(*), invoice_audit_events(*)")
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
    payments?: Array<Partial<InvoicePaymentRow>>;
    scope_changes?: Array<Partial<InvoiceScopeChangeRow>>;
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

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("client_id" in body) patch.client_id = body.client_id ?? null;
  if ("title" in body) patch.title = body.title?.trim() || null;
  if ("status" in body) patch.status = body.status?.trim() || "draft";
  if ("service_address" in body) patch.service_address = body.service_address?.trim() || null;
  if ("prepared_by" in body) patch.prepared_by = body.prepared_by?.trim() || "Palm Beach Property Pros";
  if ("issue_date" in body) patch.issue_date = body.issue_date || new Date().toISOString().slice(0, 10);
  if ("due_date" in body) patch.due_date = body.due_date || null;
  if ("invoice_number" in body) patch.invoice_number = body.invoice_number?.trim() || null;
  if ("scope_notes" in body) patch.scope_notes = body.scope_notes?.trim() || null;
  if ("client_message" in body) patch.client_message = body.client_message?.trim() || null;

  if (Array.isArray(body.line_items)) {
    const tax_cents = Math.max(0, Math.round(Number(body.tax_cents) || 0));
    const subtotal = invoiceTotalsFromLines(body.line_items, tax_cents);
    const scopeAdjustmentCents = Array.isArray(body.scope_changes) ? scopeChangeTotalCents(body.scope_changes as Array<{ amount_cents: number }>) : 0;
    const total_cents = Math.max(0, subtotal.total_cents + scopeAdjustmentCents);
    patch.line_items = body.line_items;
    patch.subtotal_cents = subtotal.subtotal_cents;
    patch.tax_cents = tax_cents;
    patch.total_cents = total_cents;
  }

  const paymentTotal = Array.isArray(body.payments) ? paymentTotalCents(body.payments as Array<{ amount_cents: number }>) : null;
  if (paymentTotal != null && Array.isArray(body.line_items)) {
    const computedTotal = Number(patch.total_cents ?? 0);
    if (computedTotal > 0 && paymentTotal >= computedTotal && body.status !== "void") {
      patch.status = "paid";
    } else if (paymentTotal > 0 && body.status !== "void") {
      patch.status = "partial";
    }
  }

  try {
    const supabase = createServiceSupabase();
    const { data: before } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
    if (Object.keys(patch).length > 1) {
      patch.revision_number = Number((before as { revision_number?: number } | null)?.revision_number ?? 1) + 1;
    }
    const { data, error } = await supabase.from("invoices").update(patch).eq("id", id).select("*").single();
    if (error) throw error;

    if (Array.isArray(body.line_items)) await replaceInvoiceLineItems(supabase, id, body.line_items);
    if (Array.isArray(body.payments)) await replaceInvoicePayments(supabase, id, body.payments);
    if (Array.isArray(body.scope_changes)) await replaceInvoiceScopeChanges(supabase, id, body.scope_changes);

    await supabase.from("invoice_audit_events").insert({
      invoice_id: id,
      event_type: "invoice.revised",
      summary: "Invoice revised from admin editor",
      before_snapshot: before ?? null,
      after_snapshot: data,
    });

    const { data: job } = await supabase
      .from("jobs")
      .select("id, client_id")
      .eq("invoice_id", id)
      .maybeSingle();
    const status = String(data.status ?? "draft");
    await logOperationalActivity(supabase, {
      event_type: status.toLowerCase() === "paid" ? "invoice.paid" : "invoice.updated",
      title: status.toLowerCase() === "paid" ? "Invoice marked paid" : "Invoice updated",
      body: `${String(data.title ?? "Invoice")} · ${status}`,
      job_id: job?.id ? String(job.id) : null,
      client_id: data.client_id ? String(data.client_id) : (job?.client_id ? String(job.client_id) : null),
      invoice_id: id,
      href: data.public_token ? `/invoice/${data.public_token}` : "/admin/invoices",
    });

    return NextResponse.json({ invoice: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
