import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InvoiceAuditEventRow,
  InvoiceLineItem,
  InvoicePaymentRow,
  InvoiceScopeChangeRow,
  InvoiceTemplateRow,
} from "@/lib/db-types";
import { parseLineItems } from "@/lib/quote-serialization";

export function mapInvoicePaymentRow(data: Record<string, unknown>): InvoicePaymentRow {
  const method = String(data.method ?? "cash");
  return {
    id: String(data.id),
    invoice_id: String(data.invoice_id),
    payment_date: String(data.payment_date ?? ""),
    method: method === "zelle" || method === "card" || method === "check" || method === "venmo" || method === "other" ? method : "cash",
    description: data.description != null ? String(data.description) : null,
    amount_cents: Math.round(Number(data.amount_cents) || 0),
    reference: data.reference != null ? String(data.reference) : null,
    received_by: String(data.received_by ?? "PBPP Ops"),
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? data.created_at ?? ""),
  };
}

export function mapInvoiceScopeChangeRow(data: Record<string, unknown>): InvoiceScopeChangeRow {
  const changeType = String(data.change_type ?? "adjustment");
  return {
    id: String(data.id),
    invoice_id: String(data.invoice_id),
    change_type: changeType === "addition" || changeType === "removal" || changeType === "note" ? changeType : "adjustment",
    title: String(data.title ?? "Scope change"),
    description: data.description != null ? String(data.description) : null,
    amount_cents: Math.round(Number(data.amount_cents) || 0),
    before_total_cents: data.before_total_cents == null ? null : Math.round(Number(data.before_total_cents) || 0),
    after_total_cents: data.after_total_cents == null ? null : Math.round(Number(data.after_total_cents) || 0),
    acknowledged_at: data.acknowledged_at != null ? String(data.acknowledged_at) : null,
    acknowledged_by: data.acknowledged_by != null ? String(data.acknowledged_by) : null,
    created_by: String(data.created_by ?? "PBPP Ops"),
    created_at: String(data.created_at ?? ""),
  };
}

export function mapInvoiceTemplateRow(data: Record<string, unknown>): InvoiceTemplateRow {
  return {
    id: String(data.id),
    name: String(data.name ?? "Template"),
    service_type: data.service_type != null ? String(data.service_type) : null,
    description: data.description != null ? String(data.description) : null,
    line_items: parseLineItems(data.line_items),
    scope_notes: data.scope_notes != null ? String(data.scope_notes) : null,
    default_terms: data.default_terms != null ? String(data.default_terms) : null,
    is_active: data.is_active !== false,
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? data.created_at ?? ""),
  };
}

export function mapInvoiceAuditEventRow(data: Record<string, unknown>): InvoiceAuditEventRow {
  return {
    id: String(data.id),
    invoice_id: String(data.invoice_id),
    event_type: String(data.event_type ?? "invoice.updated"),
    actor_name: String(data.actor_name ?? "PBPP Ops"),
    summary: String(data.summary ?? "Invoice updated"),
    before_snapshot: data.before_snapshot && typeof data.before_snapshot === "object" ? data.before_snapshot as Record<string, unknown> : null,
    after_snapshot: data.after_snapshot && typeof data.after_snapshot === "object" ? data.after_snapshot as Record<string, unknown> : null,
    created_at: String(data.created_at ?? ""),
  };
}

export async function replaceInvoiceLineItems(
  supabase: SupabaseClient,
  invoiceId: string,
  lineItems: InvoiceLineItem[],
): Promise<void> {
  const { error: deleteError } = await supabase.from("invoice_line_items").delete().eq("invoice_id", invoiceId);
  if (deleteError) throw deleteError;
  if (lineItems.length === 0) return;
  const { error } = await supabase.from("invoice_line_items").insert(
    lineItems.map((item, index) => ({
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_cents: item.unit_cents,
      sort_order: index + 1,
    })),
  );
  if (error) throw error;
}

export async function replaceInvoicePayments(
  supabase: SupabaseClient,
  invoiceId: string,
  payments: Array<Partial<InvoicePaymentRow>>,
): Promise<void> {
  const { error: deleteError } = await supabase.from("invoice_payments").delete().eq("invoice_id", invoiceId);
  if (deleteError) throw deleteError;
  const rows = payments
    .map((payment) => ({
      invoice_id: invoiceId,
      payment_date: payment.payment_date || new Date().toISOString().slice(0, 10),
      method: payment.method || "cash",
      description: payment.description?.trim() || null,
      amount_cents: Math.max(0, Math.round(Number(payment.amount_cents) || 0)),
      reference: payment.reference?.trim() || null,
      received_by: payment.received_by?.trim() || "PBPP Ops",
    }))
    .filter((payment) => payment.amount_cents > 0);
  if (rows.length === 0) return;
  const { error } = await supabase.from("invoice_payments").insert(rows);
  if (error) throw error;
}

export async function replaceInvoiceScopeChanges(
  supabase: SupabaseClient,
  invoiceId: string,
  changes: Array<Partial<InvoiceScopeChangeRow>>,
): Promise<void> {
  const { error: deleteError } = await supabase.from("invoice_scope_changes").delete().eq("invoice_id", invoiceId);
  if (deleteError) throw deleteError;
  const rows = changes
    .map((change) => ({
      invoice_id: invoiceId,
      change_type: change.change_type || "adjustment",
      title: change.title?.trim() || "Scope change",
      description: change.description?.trim() || null,
      amount_cents: Math.round(Number(change.amount_cents) || 0),
      before_total_cents: change.before_total_cents ?? null,
      after_total_cents: change.after_total_cents ?? null,
      acknowledged_at: change.acknowledged_at || null,
      acknowledged_by: change.acknowledged_by?.trim() || null,
      created_by: change.created_by?.trim() || "PBPP Ops",
    }))
    .filter((change) => change.title || change.description || change.amount_cents !== 0);
  if (rows.length === 0) return;
  const { error } = await supabase.from("invoice_scope_changes").insert(rows);
  if (error) throw error;
}

export function paymentTotalCents(payments: Array<{ amount_cents: number }>): number {
  return payments.reduce((sum, payment) => sum + Math.max(0, Math.round(Number(payment.amount_cents) || 0)), 0);
}

export function scopeChangeTotalCents(changes: Array<{ amount_cents: number }>): number {
  return changes.reduce((sum, change) => sum + Math.round(Number(change.amount_cents) || 0), 0);
}
