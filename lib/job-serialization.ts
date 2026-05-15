import type {
  CrewAssignment,
  JobClientEmbed,
  JobDetailPayload,
  JobInvoiceEmbed,
  JobListItem,
  JobQuoteEmbed,
  JobRow,
} from "@/lib/db-types";

export function parseCrewAssignments(raw: unknown): CrewAssignment[] {
  if (!Array.isArray(raw)) return [];
  const out: CrewAssignment[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name = String(r.name ?? "").trim();
    if (!name) continue;
    const role = r.role != null ? String(r.role).trim() : null;
    out.push({ name, role: role || null });
  }
  return out;
}

function embedOne<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) return (raw[0] as T) ?? null;
  return raw as T;
}

export function mapJobRow(data: Record<string, unknown>): JobRow {
  return {
    id: String(data.id),
    client_id: data.client_id ? String(data.client_id) : null,
    title: String(data.title ?? "Job"),
    status: String(data.status ?? "scheduled"),
    completed_at: data.completed_at != null ? String(data.completed_at) : null,
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? data.created_at ?? ""),
    row_version: Number(data.row_version) || 1,
    job_number: data.job_number != null ? String(data.job_number) : null,
    service_type: data.service_type != null ? String(data.service_type) : null,
    property_address: data.property_address != null ? String(data.property_address) : null,
    revenue_cents: Math.round(Number(data.revenue_cents) || 0),
    payment_method: data.payment_method != null ? String(data.payment_method) : null,
    quote_id: data.quote_id ? String(data.quote_id) : null,
    invoice_id: data.invoice_id ? String(data.invoice_id) : null,
    crew_assignments: parseCrewAssignments(data.crew_assignments),
    notes: data.notes != null ? String(data.notes) : null,
    internal_notes: data.internal_notes != null ? String(data.internal_notes) : null,
    referral_source: data.referral_source != null ? String(data.referral_source) : null,
    review_requested: Boolean(data.review_requested),
  };
}

export function mapJobDetailPayload(data: Record<string, unknown>): JobDetailPayload {
  const base = mapJobRow(data);
  const clients = embedOne<JobClientEmbed>(data.clients);
  const quotes = embedOne<JobQuoteEmbed>(data.quotes);
  const invoices = embedOne<JobInvoiceEmbed>(data.invoices);
  return { ...base, clients, quotes, invoices };
}

export function mapJobListItem(
  data: Record<string, unknown>,
  clientName: string | null,
): JobListItem {
  const row = mapJobRow(data);
  return {
    id: row.id,
    job_number: row.job_number,
    title: row.title,
    status: row.status,
    client_id: row.client_id,
    revenue_cents: row.revenue_cents,
    service_type: row.service_type,
    created_at: row.created_at,
    updated_at: row.updated_at,
    client_name: clientName,
  };
}
