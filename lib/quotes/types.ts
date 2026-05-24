import type { QuoteApprovalStatus } from "@/lib/quotes/constants";

export type PublicQuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order: number | null;
};

export type PublicQuoteClient = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type PublicQuote = {
  id: string;
  public_id: string;
  quote_number: string;
  service_type: string;
  job_address: string;
  status: string;
  notes: string | null;
  terms: string | null;
  expiration_date: string | null;
  deposit_required: boolean;
  deposit_amount: number;
  approval_status: QuoteApprovalStatus;
  viewed_at: string | null;
  sent_at: string | null;
  signed_at: string | null;
  signed_name: string | null;
  declined_at: string | null;
  client_signature_url: string | null;
  signed_pdf_url: string | null;
  clients: PublicQuoteClient | null;
};

export type QuoteSignResult =
  | { ok: true; signedAt: string; pdfPath: string }
  | { ok: false; error: string; code: string };

export type QuoteDeclineResult =
  | { ok: true; declinedAt: string }
  | { ok: false; error: string; code: string };
