import type { InvoiceLineItem, QuoteRow, QuoteStatus } from "@/lib/db-types";

export function parseLineItems(raw: unknown): InvoiceLineItem[] {
  if (!Array.isArray(raw)) return [];
  const out: InvoiceLineItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const description = String(r.description ?? "").trim();
    const quantity = Number(r.quantity);
    const unit_cents = Math.round(Number(r.unit_cents));
    if (!description) continue;
    if (!Number.isFinite(quantity) || quantity < 0) continue;
    if (!Number.isFinite(unit_cents)) continue;
    out.push({ description, quantity, unit_cents });
  }
  return out;
}

export function normalizeQuoteStatus(s: string | undefined): QuoteStatus {
  const v = (s ?? "draft").toLowerCase();
  if (v === "sent" || v === "approved" || v === "converted" || v === "void" || v === "draft") {
    return v;
  }
  return "draft";
}

export function mapQuoteRow(data: Record<string, unknown>): QuoteRow {
  return {
    id: String(data.id),
    client_id: data.client_id ? String(data.client_id) : null,
    service_type: data.service_type != null ? String(data.service_type) : null,
    property_address: data.property_address != null ? String(data.property_address) : null,
    notes: data.notes != null ? String(data.notes) : null,
    customer_notes: data.customer_notes != null ? String(data.customer_notes) : null,
    terms: data.terms != null ? String(data.terms) : null,
    internal_notes: data.internal_notes != null ? String(data.internal_notes) : null,
    line_items: parseLineItems(data.line_items),
    subtotal_cents: Number(data.subtotal_cents) || 0,
    tax_cents: Number(data.tax_cents) || 0,
    discount_cents: Number(data.discount_cents) || 0,
    deposit_cents: Number(data.deposit_cents) || 0,
    total_cents: Number(data.total_cents) || 0,
    status: normalizeQuoteStatus(String(data.status)),
    reference_code: data.reference_code != null ? String(data.reference_code) : null,
    row_version: Number(data.row_version) || 1,
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? ""),
  };
}
