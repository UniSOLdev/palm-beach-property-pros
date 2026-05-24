import type { QuoteApprovalStatus } from "@/lib/quotes/constants";
import type { PublicQuote, PublicQuoteItem } from "@/lib/quotes/types";

const APPROVAL_STATUSES = ["pending", "viewed", "signed", "declined"] as const;

function asApprovalStatus(value: unknown): QuoteApprovalStatus {
  if (typeof value === "string" && APPROVAL_STATUSES.includes(value as QuoteApprovalStatus)) {
    return value as QuoteApprovalStatus;
  }
  return "pending";
}

function parseClient(value: unknown): PublicQuote["clients"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return {
    name: typeof row.name === "string" ? row.name : undefined,
    email: typeof row.email === "string" ? row.email : null,
    phone: typeof row.phone === "string" ? row.phone : null,
    address: typeof row.address === "string" ? row.address : undefined,
  };
}

function parseItems(value: unknown): PublicQuoteItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map((row) => ({
      id: String(row.id ?? ""),
      description: String(row.description ?? ""),
      quantity: Number(row.quantity ?? 1),
      unit_price: Number(row.unit_price ?? 0),
      sort_order: row.sort_order != null ? Number(row.sort_order) : null,
    }))
    .filter((item) => item.id && item.description);
}

/** Normalize Supabase quote row + nested quote_items for public view. */
export function mapPublicQuote(row: Record<string, unknown>, fallbackItems?: PublicQuoteItem[]) {
  const nestedItems = parseItems(row.quote_items);
  const items = nestedItems.length ? nestedItems : (fallbackItems ?? []);

  const quote: PublicQuote = {
    id: String(row.id ?? ""),
    public_id: String(row.public_id ?? ""),
    quote_number: String(row.quote_number ?? ""),
    service_type: String(row.service_type ?? ""),
    job_address: String(row.job_address ?? ""),
    status: String(row.status ?? "sent"),
    notes: typeof row.notes === "string" ? row.notes : null,
    terms: typeof row.terms === "string" ? row.terms : null,
    expiration_date: typeof row.expiration_date === "string" ? row.expiration_date : null,
    deposit_required: Boolean(row.deposit_required),
    deposit_amount: Number(row.deposit_amount ?? 0),
    approval_status: asApprovalStatus(row.approval_status),
    viewed_at: typeof row.viewed_at === "string" ? row.viewed_at : null,
    sent_at: typeof row.sent_at === "string" ? row.sent_at : null,
    signed_at: typeof row.signed_at === "string" ? row.signed_at : null,
    signed_name: typeof row.signed_name === "string" ? row.signed_name : null,
    declined_at: typeof row.declined_at === "string" ? row.declined_at : null,
    client_signature_url: typeof row.client_signature_url === "string" ? row.client_signature_url : null,
    signed_pdf_url: typeof row.signed_pdf_url === "string" ? row.signed_pdf_url : null,
    clients: parseClient(row.clients),
  };

  return { quote, items };
}

export type PublicQuoteBundle = ReturnType<typeof mapPublicQuote>;
