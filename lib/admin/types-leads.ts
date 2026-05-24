import type { LeadStatus } from "@/lib/admin/lead-constants";

export type QuoteRequestRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service_requested: string;
  address: string;
  city: string | null;
  property_type: string | null;
  message: string | null;
  preferred_contact: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  photo_urls: string[];
  source: string;
  referrer: string | null;
  status: LeadStatus;
  client_id: string | null;
  quote_id: string | null;
  invoice_id: string | null;
  internal_notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type QuoteRequestActivityRow = {
  id: string;
  quote_request_id: string;
  activity_type: "note" | "status_change" | "contact" | "converted" | "system";
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
};
